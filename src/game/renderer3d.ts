import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { Camera, Entity, Particle, PlayerStats, PowerUpType, Tile, VisualEffect, WorldDefinition } from '../types';
import { PHYSICS_CONFIG } from './physics';

const TILE_SIZE = PHYSICS_CONFIG.TILE_SIZE;
const SCALE_3D = 0.1; // 1 pixel in 2D = 0.1 unit in 3D (32px tile = 3.2 3D units)

export type Camera3DMode = 'action3d' | 'diorama3d' | 'classic25d';

export interface BlobShadowData {
  id: string;
  x: number;
  floorY: number;
  altitude: number;
  baseWidth: number;
}

// --- CUSTOM MOTION BLUR, SPEED LINES & DYNAMIC EDGE GLOW POST-PROCESSING SHADER ---
export const MotionBlurShader = {
  name: 'MotionBlurShader',
  uniforms: {
    tDiffuse: { value: null as THREE.Texture | null },
    uVelocity: { value: new THREE.Vector2(0, 0) },
    uCenter: { value: new THREE.Vector2(0.5, 0.5) },
    uStrength: { value: 0.0 },
    uRadialStrength: { value: 0.0 },
    uChromaticAberration: { value: 0.0 },
    uSpeedLinesStrength: { value: 0.0 },
    uHealthPercent: { value: 1.0 },
    uDamageFlash: { value: 0.0 },
    uLowHealthPulse: { value: 0.0 },
    uTime: { value: 0.0 },
    uResolution: { value: new THREE.Vector2(800, 450) },
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform vec2 uVelocity;
    uniform vec2 uCenter;
    uniform float uStrength;
    uniform float uRadialStrength;
    uniform float uChromaticAberration;
    uniform float uSpeedLinesStrength;
    uniform float uHealthPercent;
    uniform float uDamageFlash;
    uniform float uLowHealthPulse;
    uniform float uTime;
    uniform vec2 uResolution;
    varying vec2 vUv;

    const int SAMPLES = 12;

    void main() {
      vec4 baseColor;

      if (uStrength <= 0.0005 && uRadialStrength <= 0.0005) {
        baseColor = texture2D(tDiffuse, vUv);
      } else {
        // Directional velocity offset (motion blur along player movement vector)
        vec2 dirOffset = uVelocity * uStrength * 0.042;
        
        // Radial velocity offset (warp towards center of movement)
        vec2 radialDir = (vUv - uCenter);
        float dist = length(radialDir);
        vec2 radOffset = radialDir * uRadialStrength * 0.048 * smoothstep(0.04, 0.75, dist);

        vec2 totalOffset = dirOffset + radOffset;

        vec4 accum = vec4(0.0);
        float totalWeight = 0.0;
        float chroma = uChromaticAberration * 0.016;

        for (int i = 0; i < SAMPLES; i++) {
          float t = (float(i) / float(SAMPLES - 1)) - 0.5; // -0.5 to 0.5
          float weight = 1.0 - abs(t) * 0.42; // Center-weighted sampling

          vec2 sampleUv = vUv + totalOffset * t;
          sampleUv = clamp(sampleUv, vec2(0.001), vec2(0.999));

          if (chroma > 0.001) {
            vec2 rUv = clamp(sampleUv + totalOffset * (chroma * t * 1.5), vec2(0.001), vec2(0.999));
            vec2 bUv = clamp(sampleUv - totalOffset * (chroma * t * 1.5), vec2(0.001), vec2(0.999));
            float r = texture2D(tDiffuse, rUv).r;
            float g = texture2D(tDiffuse, sampleUv).g;
            float b = texture2D(tDiffuse, bUv).b;
            float a = texture2D(tDiffuse, sampleUv).a;
            accum += vec4(r, g, b, a) * weight;
          } else {
            accum += texture2D(tDiffuse, sampleUv) * weight;
          }
          totalWeight += weight;
        }

        baseColor = accum / totalWeight;
      }

      // Procedural Dynamic Speed Lines Overlay
      if (uSpeedLinesStrength > 0.002) {
        vec2 aspect = vec2(uResolution.x / max(uResolution.y, 1.0), 1.0);
        vec2 aspectCorrectedDir = (vUv - uCenter) * aspect;
        float dist = length(aspectCorrectedDir);
        float angle = atan(aspectCorrectedDir.y, aspectCorrectedDir.x);

        // High frequency animated radial streak waves
        float streak1 = sin(angle * 48.0 + uTime * 36.0);
        float streak2 = cos(angle * 32.0 - uTime * 28.0 + 1.2);
        float streak3 = sin(angle * 72.0 + uTime * 52.0);
        float combinedStreaks = streak1 * 0.5 + streak2 * 0.3 + streak3 * 0.2;

        float lineMask = smoothstep(0.42, 0.94, combinedStreaks);
        // Fade in from inner circle toward outer screen borders
        float borderFade = smoothstep(0.18, 0.85, dist);
        float finalLineAlpha = lineMask * borderFade * uSpeedLinesStrength;

        // Bright luminous cyan-white anime speed streak colors
        vec3 streakTint = mix(vec3(0.55, 0.88, 1.0), vec3(1.0, 1.0, 1.0), smoothstep(0.65, 0.98, combinedStreaks));
        
        baseColor.rgb = mix(baseColor.rgb, streakTint, finalLineAlpha * 0.75);
        baseColor.rgb += streakTint * (finalLineAlpha * 0.45); // Luminous pop
      }

      // Dynamic Edge Glow & Damage Pulse
      vec2 edgeDistVec = max(abs(vUv - 0.5) * 2.0 - 0.42, 0.0);
      float edgeDist = length(edgeDistVec);
      float edgeFactor = smoothstep(0.0, 0.58, edgeDist);

      // White/Cyan flash when Milo takes damage
      if (uDamageFlash > 0.005) {
        vec3 flashColor = vec3(1.0, 0.96, 0.98);
        baseColor.rgb = mix(baseColor.rgb, flashColor, uDamageFlash * 0.72);
        baseColor.rgb += flashColor * (edgeFactor * uDamageFlash * 0.95);
      }

      // Screen boundary edge glow based on health %
      if (uHealthPercent < 0.35) {
        // Critical danger: pulsing crimson red vignette
        float pulse = 0.65 + 0.35 * uLowHealthPulse;
        vec3 redGlow = vec3(0.95, 0.05, 0.15);
        baseColor.rgb = mix(baseColor.rgb, redGlow, edgeFactor * 0.75 * pulse);
        baseColor.rgb += redGlow * (edgeFactor * edgeFactor * 0.45 * pulse);
      } else if (uHealthPercent < 0.68) {
        // Caution: warm amber edge tint
        vec3 amberGlow = vec3(0.92, 0.48, 0.12);
        baseColor.rgb = mix(baseColor.rgb, amberGlow, edgeFactor * 0.38);
      }

      gl_FragColor = baseColor;
    }
  `
};

export class GameRenderer3D {
  private canvas: HTMLCanvasElement;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera3D: THREE.PerspectiveCamera;
  
  public cameraMode: Camera3DMode = 'action3d';
  public mirrorMode: boolean = false;

  // Post-Processing & Motion Blur / Speed Lines
  private composer: EffectComposer;
  private renderPass: RenderPass;
  private motionBlurPass: ShaderPass;
  private currentBlurStrength: number = 0;
  private currentRadialStrength: number = 0;
  private currentChromatic: number = 0;
  private currentSpeedLinesStrength: number = 0;
  
  // Lighting
  private ambientLight: THREE.AmbientLight;
  private sunLight: THREE.DirectionalLight;
  private hemiLight: THREE.HemisphereLight;
  private playerPointLight: THREE.PointLight;
  private bossPointLight: THREE.PointLight;

  // Scene Groups
  private terrainGroup: THREE.Group;
  private shadowGroup: THREE.Group;
  private entityGroup: THREE.Group;
  private particleGroup: THREE.Group;
  private effectsGroup: THREE.Group;
  private backgroundGroup: THREE.Group;
  private skyGroup: THREE.Group;

  // Blob Shadows
  private blobShadowMap: Map<string, THREE.Mesh> = new Map();
  private blobShadowTexture: THREE.CanvasTexture | null = null;
  private foliageMeshes: THREE.Mesh[] = [];
  
  // Milo 3D Character
  private miloGroup: THREE.Group;
  private miloBody: THREE.Mesh;
  private miloHead: THREE.Mesh;
  private miloCap: THREE.Mesh;
  private miloScarf: THREE.Group;
  private miloScarfSegments: THREE.Mesh[] = [];
  private miloLeftArm: THREE.Group;
  private miloRightArm: THREE.Group;
  private miloLeftLeg: THREE.Group;
  private miloRightLeg: THREE.Group;
  private miloBackpack: THREE.Mesh;
  private miloStarCrystal: THREE.Mesh;
  private miloWings: THREE.Group;
  private miloStoneCrags: THREE.Group;
  private miloLightningRing: THREE.Mesh;
  private miloFireAura: THREE.Mesh;

  // Milo Dash Radial Cooldown Indicator
  private miloDashCooldownSprite: THREE.Sprite;
  private miloDashCanvas: HTMLCanvasElement;
  private miloDashCtx: CanvasRenderingContext2D | null;
  private miloDashTexture: THREE.CanvasTexture;
  private prevDashCooldown: number = 0;
  private dashReadyFlashTimer: number = 0;

  // Materials Cache
  private materials: Map<string, THREE.Material> = new Map();
  private geometries: Map<string, THREE.BufferGeometry> = new Map();

  // Active Entity Meshes Cache
  private entityMeshMap: Map<string, THREE.Object3D> = new Map();
  
  // Floating Background Props
  private bgClouds: { mesh: THREE.Object3D; speed: number; startX: number; range: number }[] = [];
  private bgProps: THREE.Object3D[] = [];

  // Cached Level Key to avoid rebuilding static tiles each frame
  private lastLevelKey: string = '';

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    
    // 1. Create WebGL Renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      powerPreference: 'high-performance',
      alpha: false,
    });
    this.renderer.setSize(canvas.clientWidth || 800, canvas.clientHeight || 450, false);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // 2. Scene
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x0f172a, 0.012);

    // 3. Camera
    const aspect = (canvas.clientWidth || 800) / (canvas.clientHeight || 450);
    this.camera3D = new THREE.PerspectiveCamera(52, aspect, 0.5, 300);
    this.camera3D.position.set(0, 15, 35);

    // 4. Lighting
    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    this.scene.add(this.ambientLight);

    this.hemiLight = new THREE.HemisphereLight(0xfff7ed, 0x1e293b, 0.5);
    this.scene.add(this.hemiLight);

    this.sunLight = new THREE.DirectionalLight(0xfffbeb, 1.4);
    this.sunLight.position.set(25, 45, 35);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.width = 1024;
    this.sunLight.shadow.mapSize.height = 1024;
    this.sunLight.shadow.camera.near = 1;
    this.sunLight.shadow.camera.far = 120;
    this.sunLight.shadow.camera.left = -30;
    this.sunLight.shadow.camera.right = 30;
    this.sunLight.shadow.camera.top = 25;
    this.sunLight.shadow.camera.bottom = -25;
    this.sunLight.shadow.bias = -0.0005;
    this.scene.add(this.sunLight);

    this.playerPointLight = new THREE.PointLight(0xfacc15, 1.2, 18);
    this.playerPointLight.castShadow = false;
    this.scene.add(this.playerPointLight);

    this.bossPointLight = new THREE.PointLight(0xef4444, 2.0, 30);
    this.bossPointLight.position.set(0, -999, 0);
    this.scene.add(this.bossPointLight);

    // 5. Structure Groups
    this.skyGroup = new THREE.Group();
    this.backgroundGroup = new THREE.Group();
    this.terrainGroup = new THREE.Group();
    this.shadowGroup = new THREE.Group();
    this.entityGroup = new THREE.Group();
    this.particleGroup = new THREE.Group();
    this.effectsGroup = new THREE.Group();

    this.scene.add(this.skyGroup);
    this.scene.add(this.backgroundGroup);
    this.scene.add(this.terrainGroup);
    this.scene.add(this.shadowGroup);
    this.scene.add(this.entityGroup);
    this.scene.add(this.particleGroup);
    this.scene.add(this.effectsGroup);

    // Initialize High-Performance Blob Shadow Texture
    const shadowCanvas = document.createElement('canvas');
    shadowCanvas.width = 64;
    shadowCanvas.height = 64;
    const sCtx = shadowCanvas.getContext('2d');
    if (sCtx) {
      const grad = sCtx.createRadialGradient(32, 32, 0, 32, 32, 32);
      grad.addColorStop(0, 'rgba(8, 12, 24, 0.85)');
      grad.addColorStop(0.4, 'rgba(8, 12, 24, 0.55)');
      grad.addColorStop(0.75, 'rgba(8, 12, 24, 0.18)');
      grad.addColorStop(1, 'rgba(8, 12, 24, 0.0)');
      sCtx.fillStyle = grad;
      sCtx.fillRect(0, 0, 64, 64);
    }
    this.blobShadowTexture = new THREE.CanvasTexture(shadowCanvas);

    // 6. Build Milo 3D Hero Mesh
    this.miloGroup = new THREE.Group();
    const miloParts = this.buildMiloMesh();
    this.miloBody = miloParts.body;
    this.miloHead = miloParts.head;
    this.miloCap = miloParts.cap;
    this.miloScarf = miloParts.scarf;
    this.miloScarfSegments = miloParts.scarfSegments;
    this.miloLeftArm = miloParts.leftArm;
    this.miloRightArm = miloParts.rightArm;
    this.miloLeftLeg = miloParts.leftLeg;
    this.miloRightLeg = miloParts.rightLeg;
    this.miloBackpack = miloParts.backpack;
    this.miloStarCrystal = miloParts.starCrystal;
    this.miloWings = miloParts.wings;
    this.miloStoneCrags = miloParts.stoneCrags;
    this.miloLightningRing = miloParts.lightningRing;
    this.miloFireAura = miloParts.fireAura;
    this.miloDashCooldownSprite = miloParts.dashCooldownSprite;
    this.miloDashCanvas = miloParts.dashCanvas;
    this.miloDashCtx = miloParts.dashCtx;
    this.miloDashTexture = miloParts.dashTexture;

    this.scene.add(this.miloGroup);

    // 7. Post-Processing & Speed Motion Blur
    this.composer = new EffectComposer(this.renderer);
    this.renderPass = new RenderPass(this.scene, this.camera3D);
    this.composer.addPass(this.renderPass);

    this.motionBlurPass = new ShaderPass(MotionBlurShader);
    this.motionBlurPass.uniforms.uResolution.value.set(
      canvas.clientWidth || 800,
      canvas.clientHeight || 450
    );
    this.composer.addPass(this.motionBlurPass);

    // Initialize Base Geometries & Materials
    this.initCoreMaterials();
  }

  public setSize(w: number, h: number) {
    this.renderer.setSize(w, h, false);
    this.camera3D.aspect = w / h;
    this.camera3D.updateProjectionMatrix();
    this.composer.setSize(w, h);
    if (this.motionBlurPass) {
      this.motionBlurPass.uniforms.uResolution.value.set(w, h);
    }
  }

  public cycleCameraMode(): Camera3DMode {
    if (this.cameraMode === 'action3d') this.cameraMode = 'diorama3d';
    else if (this.cameraMode === 'diorama3d') this.cameraMode = 'classic25d';
    else this.cameraMode = 'action3d';
    return this.cameraMode;
  }

  // --- MATERIAL INITIALIZATION ---
  private initCoreMaterials() {
    // Starshard material (Rich glowing gold with emissive pulse)
    this.materials.set('starshard_gold', new THREE.MeshStandardMaterial({
      color: 0xfde047,
      emissive: 0xfacc15,
      emissiveIntensity: 0.6,
      roughness: 0.2,
      metalness: 0.8,
    }));

    this.materials.set('grandshard_cyan', new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 0.8,
      roughness: 0.1,
      metalness: 0.9,
    }));

    this.materials.set('grandshard_purple', new THREE.MeshStandardMaterial({
      color: 0xc084fc,
      emissive: 0x9333ea,
      emissiveIntensity: 0.8,
      roughness: 0.1,
      metalness: 0.9,
    }));

    this.materials.set('memory_shard', new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x2563eb,
      emissiveIntensity: 0.9,
      roughness: 0.1,
      metalness: 0.9,
    }));

    // Crate materials
    this.materials.set('crate_wood', new THREE.MeshStandardMaterial({
      color: 0xb45309,
      roughness: 0.7,
      metalness: 0.1,
    }));

    this.materials.set('crate_stone', new THREE.MeshStandardMaterial({
      color: 0x64748b,
      roughness: 0.8,
      metalness: 0.2,
    }));

    this.materials.set('spikes', new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      roughness: 0.3,
      metalness: 0.8,
    }));

    this.materials.set('spring', new THREE.MeshStandardMaterial({
      color: 0xef4444,
      emissive: 0xb91c1c,
      emissiveIntensity: 0.3,
      roughness: 0.3,
      metalness: 0.4,
    }));
  }

  // --- BUILD MILO 3D HERO CHARACTER ---
  private buildMiloMesh() {
    const group = new THREE.Group();

    // 1. Tunic / Body
    const bodyGeo = new THREE.CylinderGeometry(0.7, 0.85, 1.4, 12);
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.5, metalness: 0.1 });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 1.3;
    body.castShadow = true;
    body.receiveShadow = true;
    group.add(body);

    // 2. Head
    const headGeo = new THREE.SphereGeometry(0.85, 16, 16);
    const headMat = new THREE.MeshStandardMaterial({ color: 0xfde047, roughness: 0.4 });
    const head = new THREE.Mesh(headGeo, headMat);
    head.position.y = 2.4;
    head.castShadow = true;
    group.add(head);

    // Eyes
    const eyeGeo = new THREE.SphereGeometry(0.14, 8, 8);
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x090d16 });
    const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
    leftEye.position.set(0.32, 2.45, 0.72);
    leftEye.scale.set(1, 1.4, 0.5);
    group.add(leftEye);

    const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
    rightEye.position.set(-0.32, 2.45, 0.72);
    rightEye.scale.set(1, 1.4, 0.5);
    group.add(rightEye);

    // Eye highlights
    const hiGeo = new THREE.SphereGeometry(0.04, 6, 6);
    const hiMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const hiL = new THREE.Mesh(hiGeo, hiMat);
    hiL.position.set(0.35, 2.52, 0.77);
    group.add(hiL);
    const hiR = new THREE.Mesh(hiGeo, hiMat);
    hiR.position.set(-0.29, 2.52, 0.77);
    group.add(hiR);

    // Cap / Headband
    const capGeo = new THREE.CylinderGeometry(0.9, 0.88, 0.4, 14);
    const capMat = new THREE.MeshStandardMaterial({ color: 0xe11d48, roughness: 0.4 });
    const cap = new THREE.Mesh(capGeo, capMat);
    cap.position.y = 2.9;
    cap.castShadow = true;
    group.add(cap);

    // Cute Adventure Ears
    const earGeo = new THREE.ConeGeometry(0.35, 0.7, 8);
    const earMat = new THREE.MeshStandardMaterial({ color: 0xfde047, roughness: 0.4 });
    const leftEar = new THREE.Mesh(earGeo, earMat);
    leftEar.position.set(0.75, 3.1, 0);
    leftEar.rotation.z = -0.4;
    leftEar.rotation.x = -0.2;
    group.add(leftEar);

    const rightEar = new THREE.Mesh(earGeo, earMat);
    rightEar.position.set(-0.75, 3.1, 0);
    rightEar.rotation.z = 0.4;
    rightEar.rotation.x = -0.2;
    group.add(rightEar);

    // 3. Billowing Scarf
    const scarfGroup = new THREE.Group();
    scarfGroup.position.set(0, 2.05, 0);
    const scarfSegments: THREE.Mesh[] = [];
    const scarfMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.3 });

    // Scarf Collar
    const collarGeo = new THREE.TorusGeometry(0.75, 0.16, 8, 16);
    const collar = new THREE.Mesh(collarGeo, scarfMat);
    collar.rotation.x = Math.PI / 2;
    scarfGroup.add(collar);

    // Scarf Ribbon Tails (3 jointed links for dynamic wind physics)
    for (let i = 0; i < 4; i++) {
      const segGeo = new THREE.BoxGeometry(0.35 - i * 0.05, 0.1, 0.5);
      const seg = new THREE.Mesh(segGeo, scarfMat);
      seg.position.set(0.2, -0.1 - i * 0.15, -0.7 - i * 0.45);
      seg.castShadow = true;
      scarfGroup.add(seg);
      scarfSegments.push(seg);
    }
    group.add(scarfGroup);

    // 4. Arms & Hands
    const limbMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.5 });
    const handMat = new THREE.MeshStandardMaterial({ color: 0xfde047, roughness: 0.4 });

    // Left Arm
    const leftArm = new THREE.Group();
    leftArm.position.set(0.9, 1.8, 0);
    const armLGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.7, 8);
    const armLMesh = new THREE.Mesh(armLGeo, limbMat);
    armLMesh.position.y = -0.35;
    armLMesh.castShadow = true;
    leftArm.add(armLMesh);
    const handLGeo = new THREE.SphereGeometry(0.26, 8, 8);
    const handLMesh = new THREE.Mesh(handLGeo, handMat);
    handLMesh.position.y = -0.75;
    handLMesh.castShadow = true;
    leftArm.add(handLMesh);
    group.add(leftArm);

    // Right Arm
    const rightArm = new THREE.Group();
    rightArm.position.set(-0.9, 1.8, 0);
    const armRGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.7, 8);
    const armRMesh = new THREE.Mesh(armRGeo, limbMat);
    armRMesh.position.y = -0.35;
    armRMesh.castShadow = true;
    rightArm.add(armRMesh);
    const handRGeo = new THREE.SphereGeometry(0.26, 8, 8);
    const handRMesh = new THREE.Mesh(handRGeo, handMat);
    handRMesh.position.y = -0.75;
    handRMesh.castShadow = true;
    rightArm.add(handRMesh);
    group.add(rightArm);

    // 5. Legs & Boots
    const bootMat = new THREE.MeshStandardMaterial({ color: 0x854d0e, roughness: 0.6 });

    // Left Leg
    const leftLeg = new THREE.Group();
    leftLeg.position.set(0.4, 0.8, 0);
    const legLGeo = new THREE.CylinderGeometry(0.22, 0.2, 0.6, 8);
    const legLMesh = new THREE.Mesh(legLGeo, limbMat);
    legLMesh.position.y = -0.3;
    legLMesh.castShadow = true;
    leftLeg.add(legLMesh);
    const bootLGeo = new THREE.BoxGeometry(0.45, 0.35, 0.65);
    const bootLMesh = new THREE.Mesh(bootLGeo, bootMat);
    bootLMesh.position.set(0, -0.65, 0.1);
    bootLMesh.castShadow = true;
    leftLeg.add(bootLMesh);
    group.add(leftLeg);

    // Right Leg
    const rightLeg = new THREE.Group();
    rightLeg.position.set(-0.4, 0.8, 0);
    const legRGeo = new THREE.CylinderGeometry(0.22, 0.2, 0.6, 8);
    const legRMesh = new THREE.Mesh(legRGeo, limbMat);
    legRMesh.position.y = -0.3;
    legRMesh.castShadow = true;
    rightLeg.add(legRMesh);
    const bootRGeo = new THREE.BoxGeometry(0.45, 0.35, 0.65);
    const bootRMesh = new THREE.Mesh(bootRGeo, bootMat);
    bootRMesh.position.set(0, -0.65, 0.1);
    bootRMesh.castShadow = true;
    rightLeg.add(bootRMesh);
    group.add(rightLeg);

    // 6. Adventurer Backpack & Glowing Star Crystal
    const bagGeo = new THREE.BoxGeometry(0.9, 1.0, 0.55);
    const bagMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.8 });
    const backpack = new THREE.Mesh(bagGeo, bagMat);
    backpack.position.set(0, 1.4, -0.65);
    backpack.castShadow = true;
    group.add(backpack);

    const starCrystGeo = new THREE.OctahedronGeometry(0.28, 0);
    const starCrystMat = new THREE.MeshStandardMaterial({
      color: 0xfde047,
      emissive: 0xfacc15,
      emissiveIntensity: 0.9,
      roughness: 0.1,
      metalness: 0.9,
    });
    const starCrystal = new THREE.Mesh(starCrystGeo, starCrystMat);
    starCrystal.position.set(0, 1.4, -0.98);
    group.add(starCrystal);

    // 7. Power-Up Visual Accessories (Wings, Stone Crags, Lightning, Fire Aura)
    // Wind Feather Wings
    const wings = new THREE.Group();
    const wingMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 0.6,
      transparent: true,
      opacity: 0.85,
      side: THREE.DoubleSide,
    });
    const wingGeo = new THREE.ConeGeometry(0.5, 1.6, 4);
    const wL = new THREE.Mesh(wingGeo, wingMat);
    wL.rotation.z = Math.PI / 3;
    wL.position.set(1.1, 1.6, -0.5);
    wings.add(wL);
    const wR = new THREE.Mesh(wingGeo, wingMat);
    wR.rotation.z = -Math.PI / 3;
    wR.position.set(-1.1, 1.6, -0.5);
    wings.add(wR);
    wings.visible = false;
    group.add(wings);

    // Stone Heart Crags
    const stoneCrags = new THREE.Group();
    const stoneMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.9 });
    const shL = new THREE.Mesh(new THREE.DodecahedronGeometry(0.45), stoneMat);
    shL.position.set(1.0, 1.9, 0);
    stoneCrags.add(shL);
    const shR = new THREE.Mesh(new THREE.DodecahedronGeometry(0.45), stoneMat);
    shR.position.set(-1.0, 1.9, 0);
    stoneCrags.add(shR);
    stoneCrags.visible = false;
    group.add(stoneCrags);

    // Lightning Bloom Ring
    const ringGeo = new THREE.TorusGeometry(1.4, 0.08, 6, 20);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });
    const lightningRing = new THREE.Mesh(ringGeo, ringMat);
    lightningRing.position.set(0, 1.5, 0);
    lightningRing.rotation.x = Math.PI / 2;
    lightningRing.visible = false;
    group.add(lightningRing);

    // Fire Aura Sphere
    const fireGeo = new THREE.SphereGeometry(1.5, 12, 12);
    const fireMat = new THREE.MeshBasicMaterial({
      color: 0xf97316,
      transparent: true,
      opacity: 0.35,
      wireframe: true,
    });
    const fireAura = new THREE.Mesh(fireGeo, fireMat);
    fireAura.position.set(0, 1.5, 0);
    fireAura.visible = false;
    group.add(fireAura);

    // 8. Air Dash Radial Cooldown Ring (Floating Halo at Milo's feet)
    const dashCanvas = document.createElement('canvas');
    dashCanvas.width = 128;
    dashCanvas.height = 128;
    const dashCtx = dashCanvas.getContext('2d');
    const dashTexture = new THREE.CanvasTexture(dashCanvas);
    const dashMat = new THREE.SpriteMaterial({
      map: dashTexture,
      transparent: true,
      depthWrite: false,
    });
    const dashCooldownSprite = new THREE.Sprite(dashMat);
    dashCooldownSprite.position.set(0, 0.35, 0);
    dashCooldownSprite.scale.set(2.4, 2.4, 1);
    dashCooldownSprite.visible = false;
    group.add(dashCooldownSprite);

    return {
      body,
      head,
      cap,
      scarf: scarfGroup,
      scarfSegments,
      leftArm,
      rightArm,
      leftLeg,
      rightLeg,
      backpack,
      starCrystal,
      wings,
      stoneCrags,
      lightningRing,
      fireAura,
      dashCooldownSprite,
      dashCanvas,
      dashCtx,
      dashTexture,
    };
  }

  // --- THEMED 3D BACKGROUND & SKY SETUP ---
  public updateBackground(world: WorldDefinition, camera: Camera, time: number, levelWidth: number, levelHeight: number) {
    const key = `${world.id}_${levelWidth}_${levelHeight}`;
    
    // Set Scene Fog & Colors
    if (world.id === 'crystal_caverns') {
      this.scene.fog = new THREE.FogExp2(0x0f172a, 0.015);
      this.ambientLight.color.setHex(0x06b6d4);
      this.ambientLight.intensity = 0.8;
      this.sunLight.color.setHex(0xc084fc);
      this.renderer.setClearColor(0x090d16, 1);
    } else if (world.id === 'whispering_woods') {
      this.scene.fog = new THREE.FogExp2(0x064e3b, 0.014);
      this.ambientLight.color.setHex(0x84cc16);
      this.ambientLight.intensity = 0.7;
      this.sunLight.color.setHex(0x34d399);
      this.renderer.setClearColor(0x022c22, 1);
    } else if (world.id === 'emberpeak') {
      this.scene.fog = new THREE.FogExp2(0x450a0a, 0.018);
      this.ambientLight.color.setHex(0xef4444);
      this.ambientLight.intensity = 0.9;
      this.sunLight.color.setHex(0xf97316);
      this.renderer.setClearColor(0x1c1917, 1);
    } else if (world.id === 'cloudspire') {
      this.scene.fog = new THREE.FogExp2(0x0284c7, 0.01);
      this.ambientLight.color.setHex(0xbae6fd);
      this.ambientLight.intensity = 0.9;
      this.sunLight.color.setHex(0xffffff);
      this.renderer.setClearColor(0x38bdf8, 1);
    } else if (world.id === 'shadowfall') {
      this.scene.fog = new THREE.FogExp2(0x18181b, 0.02);
      this.ambientLight.color.setHex(0x8b5cf6);
      this.ambientLight.intensity = 0.6;
      this.sunLight.color.setHex(0xec4899);
      this.renderer.setClearColor(0x09090b, 1);
    } else {
      // Sunmeadow & Default
      this.scene.fog = new THREE.FogExp2(0x0284c7, 0.009);
      this.ambientLight.color.setHex(0xffffff);
      this.ambientLight.intensity = 0.85;
      this.sunLight.color.setHex(0xfef08a);
      this.renderer.setClearColor(0x0284c7, 1);
    }

    // Build or update 3D floating background mountains and clouds
    if (this.backgroundGroup.children.length === 0) {
      // Generate low-poly mountain spires in distance (Z = -25 to -60)
      const mountainMat = new THREE.MeshStandardMaterial({
        color: world.id === 'emberpeak' ? 0x7f1d1d : world.id === 'crystal_caverns' ? 0x312e81 : 0x065f46,
        roughness: 0.9,
      });

      for (let i = 0; i < 22; i++) {
        const h = 18 + Math.random() * 25;
        const rad = 10 + Math.random() * 14;
        const mGeo = new THREE.ConeGeometry(rad, h, 5);
        const mMesh = new THREE.Mesh(mGeo, mountainMat);
        const posX = i * 16 - 20;
        const posY = h / 2 - 12;
        const posZ = -35 - (i % 3) * 12;
        mMesh.position.set(posX, posY, posZ);
        this.backgroundGroup.add(mMesh);
        this.bgProps.push(mMesh);
      }

      // Generate 3D Floating Clouds
      const cloudMat = new THREE.MeshStandardMaterial({
        color: world.id === 'shadowfall' ? 0x3f3f46 : 0xffffff,
        roughness: 0.4,
        transparent: true,
        opacity: 0.88,
      });

      for (let i = 0; i < 15; i++) {
        const cloud = new THREE.Group();
        const numPuffs = 4 + Math.floor(Math.random() * 3);
        for (let p = 0; p < numPuffs; p++) {
          const r = 2.5 + Math.random() * 3.5;
          const puff = new THREE.Mesh(new THREE.SphereGeometry(r, 8, 8), cloudMat);
          puff.position.set((p - numPuffs / 2) * 3, Math.random() * 1.5, Math.random() * 2);
          cloud.add(puff);
        }
        const startX = (i * 25) - 30;
        cloud.position.set(startX, 15 + Math.random() * 18, -15 - Math.random() * 20);
        this.backgroundGroup.add(cloud);
        this.bgClouds.push({
          mesh: cloud,
          speed: 0.8 + Math.random() * 1.2,
          startX: -40,
          range: 200,
        });
      }
    }

    // Animate Floating Clouds and Foliage
    for (const c of this.bgClouds) {
      c.mesh.position.x = ((c.mesh.position.x + c.speed * 0.02 - c.startX) % c.range) + c.startX;
    }

    // Environmental Foliage Sway Animation
    for (let i = 0; i < this.foliageMeshes.length; i++) {
      const m = this.foliageMeshes[i];
      m.rotation.z = Math.sin(time * 2.8 + m.position.x * 0.45) * 0.04;
      m.position.y = (m.userData.baseY || m.position.y) + Math.sin(time * 3.2 + m.position.x * 0.35) * 0.03;
    }
  }

  // --- 3D TILE TERRAIN RENDERING ---
  public updateTerrain(tiles: Tile[], world: WorldDefinition) {
    // Generate unique key to rebuild only if level changed or crates destroyed
    const activeCrates = tiles.filter((t) => (t.type === 'crate_wood' || t.type === 'crate_stone') && t.active).length;
    const key = `${world.id}_${tiles.length}_${activeCrates}`;
    if (this.lastLevelKey === key) return;
    this.lastLevelKey = key;

    // Clear old terrain objects and foliage
    this.foliageMeshes = [];
    while (this.terrainGroup.children.length > 0) {
      const obj = this.terrainGroup.children.pop();
      if (obj && (obj as THREE.Mesh).geometry) {
        (obj as THREE.Mesh).geometry.dispose();
      }
    }

    // Prepare Materials for World Themes
    let groundTopColor = 0x22c55e; // Green grass
    let groundSideColor = 0x78350f; // Brown dirt
    if (world.id === 'crystal_caverns') {
      groundTopColor = 0x06b6d4;
      groundSideColor = 0x1e1b4b;
    } else if (world.id === 'whispering_woods') {
      groundTopColor = 0x84cc16;
      groundSideColor = 0x064e3b;
    } else if (world.id === 'emberpeak') {
      groundTopColor = 0x450a0a;
      groundSideColor = 0x1c1917;
    } else if (world.id === 'cloudspire') {
      groundTopColor = 0xbae6fd;
      groundSideColor = 0x0284c7;
    } else if (world.id === 'shadowfall') {
      groundTopColor = 0x8b5cf6;
      groundSideColor = 0x09090b;
    }

    const groundTopMat = new THREE.MeshStandardMaterial({ color: groundTopColor, roughness: 0.6 });
    const groundSideMat = new THREE.MeshStandardMaterial({ color: groundSideColor, roughness: 0.8 });
    const oneWayMat = new THREE.MeshStandardMaterial({
      color: 0xca8a04,
      emissive: 0x854d0e,
      emissiveIntensity: 0.2,
      roughness: 0.4,
      metalness: 0.2,
    });
    const lavaMat = new THREE.MeshStandardMaterial({
      color: 0xef4444,
      emissive: 0xdc2626,
      emissiveIntensity: 0.9,
      roughness: 0.2,
    });

    const boxGeo = new THREE.BoxGeometry(3.2, 3.2, 4.0);
    const halfBoxGeo = new THREE.BoxGeometry(3.2, 0.8, 3.6);
    const spikeGeo = new THREE.ConeGeometry(0.6, 2.4, 4);

    // Render Blocks
    for (const t of tiles) {
      if (!t.active || t.type === 'empty') continue;

      const posX = t.x * 3.2 + 1.6;
      const posY = -t.y * 3.2 - 1.6;

      if (t.type === 'ground' || t.type === 'solid') {
        const mat = t.type === 'ground' ? groundTopMat : groundSideMat;
        const mesh = new THREE.Mesh(boxGeo, mat);
        mesh.position.set(posX, posY, 0);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        this.terrainGroup.add(mesh);

        // Add top decorative grass trim for ground tiles
        if (t.type === 'ground') {
          const trimGeo = new THREE.BoxGeometry(3.2, 0.4, 4.1);
          const trimMesh = new THREE.Mesh(trimGeo, groundTopMat);
          trimMesh.position.set(posX, posY + 1.4, 0);
          trimMesh.userData = { baseY: posY + 1.4 };
          this.terrainGroup.add(trimMesh);
          this.foliageMeshes.push(trimMesh);
        }
      } else if (t.type === 'platform_oneway') {
        const mesh = new THREE.Mesh(halfBoxGeo, oneWayMat);
        mesh.position.set(posX, posY + 1.2, 0);
        mesh.userData = { baseY: posY + 1.2 };
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        this.terrainGroup.add(mesh);
        this.foliageMeshes.push(mesh);
      } else if (t.type === 'crate_wood') {
        const mesh = new THREE.Mesh(new THREE.BoxGeometry(2.8, 2.8, 2.8), this.materials.get('crate_wood'));
        mesh.position.set(posX, posY, 0);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        this.terrainGroup.add(mesh);
      } else if (t.type === 'crate_stone') {
        const mesh = new THREE.Mesh(new THREE.BoxGeometry(2.8, 2.8, 2.8), this.materials.get('crate_stone'));
        mesh.position.set(posX, posY, 0);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        this.terrainGroup.add(mesh);
      } else if (t.type === 'hazard_spikes') {
        for (let sp = -1; sp <= 1; sp++) {
          const spike = new THREE.Mesh(spikeGeo, this.materials.get('spikes'));
          spike.position.set(posX + sp * 0.9, posY - 0.4, 0);
          spike.castShadow = true;
          this.terrainGroup.add(spike);
        }
      } else if (t.type === 'hazard_lava') {
        const lava = new THREE.Mesh(boxGeo, lavaMat);
        lava.position.set(posX, posY, 0);
        this.terrainGroup.add(lava);
      } else if (t.type === 'spring_up' || t.type === 'spring_super') {
        const padGeo = new THREE.CylinderGeometry(1.2, 1.4, 0.8, 12);
        const pad = new THREE.Mesh(padGeo, this.materials.get('spring'));
        pad.position.set(posX, posY - 1.0, 0);
        pad.castShadow = true;
        this.terrainGroup.add(pad);
      }
    }
  }

  // --- 3D ENTITY RENDERING (Collectibles, Enemies, Bosses, Beacons) ---
  public updateEntities(entities: Entity[], time: number) {
    const activeIds = new Set<string>();

    for (const ent of entities) {
      if (!ent.active) continue;
      activeIds.add(ent.id);

      let obj = this.entityMeshMap.get(ent.id);
      const posX = (ent.x + ent.width / 2) * SCALE_3D;
      const posY = -(ent.y + ent.height) * SCALE_3D;

      if (!obj) {
        obj = this.createEntityMesh(ent);
        this.entityMeshMap.set(ent.id, obj);
        this.entityGroup.add(obj);
      }

      // Position update
      obj.position.set(posX, posY, 0);

      // Facing orientation
      if (ent.facing === -1) {
        obj.rotation.y = Math.PI;
      } else {
        obj.rotation.y = 0;
      }

      // Specific Entity Animations
      if (ent.type === 'starshard_common') {
        obj.rotation.y = time * 3;
        obj.position.y += Math.sin(time * 4 + ent.x) * 0.25;
      } else if (ent.type.startsWith('starshard_grand')) {
        obj.rotation.y = time * 2;
        obj.rotation.x = Math.sin(time * 2) * 0.2;
        obj.position.y += Math.sin(time * 3 + ent.x) * 0.35;
      } else if (ent.type === 'memory_shard') {
        obj.rotation.y = time * 1.5;
        obj.position.y += Math.sin(time * 2.5 + ent.x) * 0.4;
      } else if (ent.type.startsWith('powerup')) {
        obj.rotation.y = time * 2.5;
        obj.position.y += Math.sin(time * 3 + ent.x) * 0.3;
      } else if (ent.type === 'heart_pickup') {
        const scale = 1.0 + Math.sin(time * 5) * 0.15;
        obj.scale.set(scale, scale, scale);
        obj.position.y += Math.sin(time * 3) * 0.2;
      } else if (ent.type === 'moving_platform') {
        obj.position.x = (ent.x + ent.width / 2) * SCALE_3D;
        obj.position.y = -ent.y * SCALE_3D + Math.sin(time * 2.2 + ent.x * 0.15) * 0.08;
        obj.rotation.z = Math.sin(time * 1.8 + ent.x * 0.1) * 0.025;
      } else if (ent.type === 'falling_platform') {
        if (ent.state === 'shaking') {
          obj.position.x += (Math.random() - 0.5) * 0.18;
          obj.rotation.z = (Math.random() - 0.5) * 0.06;
        } else if (ent.state === 'falling') {
          obj.rotation.z = Math.sin(time * 12) * 0.12;
        } else {
          obj.position.y = -ent.y * SCALE_3D + Math.sin(time * 2.0 + ent.x * 0.15) * 0.06;
          obj.rotation.z = Math.sin(time * 1.6 + ent.x * 0.1) * 0.02;
        }
      } else if (ent.type.startsWith('enemy')) {
        // Subtle walking waddle
        obj.rotation.z = Math.sin(time * 8) * 0.1;
      } else if (ent.type === 'boss_entity') {
        // Boss Breathing / Hurt Flash
        const isHurt = ent.customData?.hurtFlashTimer > 0;
        if (isHurt) {
          obj.scale.set(1.2, 1.2, 1.2);
        } else {
          obj.scale.set(1.0, 1.0, 1.0);
        }
        this.bossPointLight.position.set(posX, posY + 3, 2);
      } else if (ent.type === 'sky_beacon') {
        // Rotating beacon halos
        const ring = obj.getObjectByName('beacon_ring');
        if (ring) ring.rotation.z = time * 2;
      }
    }

    // Clean up expired entities
    for (const [id, mesh] of this.entityMeshMap.entries()) {
      if (!activeIds.has(id)) {
        this.entityGroup.remove(mesh);
        this.entityMeshMap.delete(id);
      }
    }
  }

  // --- ENTITY MESH FACTORY ---
  private createEntityMesh(ent: Entity): THREE.Object3D {
    const group = new THREE.Group();

    switch (ent.type) {
      case 'starshard_common': {
        // 3D 5-Pointed Star
        const starGeo = new THREE.OctahedronGeometry(0.7, 0);
        const starMat = this.materials.get('starshard_gold')!;
        const star = new THREE.Mesh(starGeo, starMat);
        star.scale.set(1.2, 1.2, 0.4);
        star.castShadow = true;
        group.add(star);
        break;
      }

      case 'starshard_grand_1':
      case 'starshard_grand_2':
      case 'starshard_grand_3': {
        const isCyan = ent.type.endsWith('1');
        const mat = isCyan ? this.materials.get('grandshard_cyan')! : this.materials.get('grandshard_purple')!;
        const coreGeo = new THREE.OctahedronGeometry(1.2, 1);
        const core = new THREE.Mesh(coreGeo, mat);
        core.castShadow = true;
        group.add(core);

        // Orbital Ring
        const ringGeo = new THREE.TorusGeometry(1.6, 0.08, 8, 24);
        const ring = new THREE.Mesh(ringGeo, mat);
        ring.rotation.x = Math.PI / 3;
        group.add(ring);
        break;
      }

      case 'memory_shard': {
        // Ancient Obelisk Crystal Shard
        const shardGeo = new THREE.CylinderGeometry(0.3, 0.8, 2.2, 6);
        const shardMat = this.materials.get('memory_shard')!;
        const shard = new THREE.Mesh(shardGeo, shardMat);
        shard.castShadow = true;
        group.add(shard);

        // Energy Ring
        const ringMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
        const ring = new THREE.Mesh(new THREE.TorusGeometry(1.3, 0.05, 6, 16), ringMat);
        ring.rotation.x = Math.PI / 2;
        group.add(ring);
        break;
      }

      case 'powerup_ember':
      case 'powerup_feather':
      case 'powerup_stone':
      case 'powerup_lightning': {
        let col = 0xf97316;
        if (ent.type === 'powerup_feather') col = 0x38bdf8;
        if (ent.type === 'powerup_stone') col = 0x64748b;
        if (ent.type === 'powerup_lightning') col = 0xfacc15;

        const orbMat = new THREE.MeshStandardMaterial({
          color: col,
          emissive: col,
          emissiveIntensity: 0.8,
          roughness: 0.2,
        });
        const orb = new THREE.Mesh(new THREE.SphereGeometry(0.9, 14, 14), orbMat);
        orb.castShadow = true;
        group.add(orb);
        break;
      }

      case 'heart_pickup': {
        const heartMat = new THREE.MeshStandardMaterial({
          color: 0xef4444,
          emissive: 0xdc2626,
          emissiveIntensity: 0.5,
          roughness: 0.3,
        });
        const heart = new THREE.Mesh(new THREE.DodecahedronGeometry(0.8), heartMat);
        heart.castShadow = true;
        group.add(heart);
        break;
      }

      case 'moving_platform': {
        const platMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.5 });
        const plat = new THREE.Mesh(new THREE.BoxGeometry(6.4, 1.2, 3.2), platMat);
        plat.castShadow = true;
        plat.receiveShadow = true;
        group.add(plat);
        break;
      }

      case 'falling_platform': {
        const fallMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.8 });
        const plat = new THREE.Mesh(new THREE.BoxGeometry(4.8, 1.2, 3.0), fallMat);
        plat.castShadow = true;
        plat.receiveShadow = true;
        group.add(plat);
        break;
      }

      case 'checkpoint': {
        const postMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.6 });
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.3, 4.0, 8), postMat);
        post.position.y = 2.0;
        post.castShadow = true;
        group.add(post);

        const bannerMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, emissive: 0x0369a1, emissiveIntensity: 0.5 });
        const banner = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.2, 0.1), bannerMat);
        banner.position.set(0.9, 3.2, 0);
        group.add(banner);
        break;
      }

      case 'sky_beacon': {
        // Majestic Ancient Celestial Pillar
        const baseMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.4 });
        const pillar = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.8, 6.0, 8), baseMat);
        pillar.position.y = 3.0;
        pillar.castShadow = true;
        group.add(pillar);

        const coreMat = new THREE.MeshStandardMaterial({
          color: 0xfde047,
          emissive: 0xfacc15,
          emissiveIntensity: 1.0,
        });
        const crystal = new THREE.Mesh(new THREE.OctahedronGeometry(1.4, 0), coreMat);
        crystal.position.y = 6.8;
        group.add(crystal);

        const ring = new THREE.Mesh(new THREE.TorusGeometry(2.2, 0.15, 8, 24), coreMat);
        ring.name = 'beacon_ring';
        ring.position.y = 6.8;
        group.add(ring);
        break;
      }

      // 3D Enemies
      case 'enemy_pufflet': {
        const puffMat = new THREE.MeshStandardMaterial({ color: 0xf87171, roughness: 0.5 });
        const puff = new THREE.Mesh(new THREE.SphereGeometry(1.2, 12, 12), puffMat);
        puff.position.y = 1.2;
        puff.castShadow = true;
        group.add(puff);

        // Cute glowing eyes
        const eyeMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.2, 6, 6), eyeMat);
        eyeL.position.set(0.4, 1.4, 0.9);
        group.add(eyeL);
        const eyeR = new THREE.Mesh(new THREE.SphereGeometry(0.2, 6, 6), eyeMat);
        eyeR.position.set(-0.4, 1.4, 0.9);
        group.add(eyeR);
        break;
      }

      case 'enemy_spikeling': {
        const spikeShellMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.4, metalness: 0.7 });
        const shell = new THREE.Mesh(new THREE.SphereGeometry(1.3, 10, 10), spikeShellMat);
        shell.position.y = 1.2;
        shell.scale.set(1.2, 0.9, 1.2);
        shell.castShadow = true;
        group.add(shell);

        // Spikes on top
        const spMat = new THREE.MeshStandardMaterial({ color: 0xef4444 });
        for (let i = 0; i < 4; i++) {
          const sp = new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.8, 4), spMat);
          sp.position.set((i - 1.5) * 0.6, 2.2, 0);
          group.add(sp);
        }
        break;
      }

      case 'enemy_flutterwing': {
        const bodyMat = new THREE.MeshStandardMaterial({ color: 0xa855f7 });
        const body = new THREE.Mesh(new THREE.SphereGeometry(0.9, 8, 8), bodyMat);
        body.position.y = 1.0;
        group.add(body);

        const wingMat = new THREE.MeshStandardMaterial({ color: 0xc084fc, transparent: true, opacity: 0.8, side: THREE.DoubleSide });
        const wingL = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1.2), wingMat);
        wingL.position.set(1.1, 1.3, 0);
        wingL.rotation.y = 0.4;
        group.add(wingL);
        const wingR = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1.2), wingMat);
        wingR.position.set(-1.1, 1.3, 0);
        wingR.rotation.y = -0.4;
        group.add(wingR);
        break;
      }

      case 'enemy_cinder_beetle': {
        const beetleMat = new THREE.MeshStandardMaterial({ color: 0x991b1b, emissive: 0x7f1d1d, emissiveIntensity: 0.4 });
        const beetle = new THREE.Mesh(new THREE.DodecahedronGeometry(1.3), beetleMat);
        beetle.position.y = 1.2;
        beetle.castShadow = true;
        group.add(beetle);
        break;
      }

      case 'enemy_volt_drone': {
        const droneMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, emissive: 0xeab308, emissiveIntensity: 0.7 });
        const drone = new THREE.Mesh(new THREE.SphereGeometry(1.1, 12, 12), droneMat);
        drone.position.y = 1.2;
        group.add(drone);

        const ring = new THREE.Mesh(new THREE.TorusGeometry(1.7, 0.1, 8, 16), droneMat);
        ring.position.y = 1.2;
        ring.rotation.x = Math.PI / 3;
        group.add(ring);
        break;
      }

      // Bosses
      case 'boss_entity': {
        const bossType = ent.customData?.bossType || 'grumblethorn';
        if (bossType === 'grumblethorn') {
          // Bramble King Grumblethorn
          const barkMat = new THREE.MeshStandardMaterial({ color: 0x166534, roughness: 0.9 });
          const bossBody = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.6, 5.5, 10), barkMat);
          bossBody.position.y = 2.8;
          bossBody.castShadow = true;
          group.add(bossBody);

          // Thorn Crown
          const crownMat = new THREE.MeshStandardMaterial({ color: 0xb45309 });
          for (let i = 0; i < 5; i++) {
            const thorn = new THREE.Mesh(new THREE.ConeGeometry(0.5, 1.8, 4), crownMat);
            const a = (i / 5) * Math.PI * 2;
            thorn.position.set(Math.cos(a) * 2.0, 5.8, Math.sin(a) * 2.0);
            group.add(thorn);
          }

          // Glowing Ruby Core Eye
          const eyeMat = new THREE.MeshStandardMaterial({ color: 0xef4444, emissive: 0xdc2626, emissiveIntensity: 1.0 });
          const eye = new THREE.Mesh(new THREE.SphereGeometry(0.8, 12, 12), eyeMat);
          eye.position.set(0, 3.5, 2.0);
          group.add(eye);
        } else if (bossType === 'geode_goliath') {
          // Geode Goliath (Crystal Titan)
          const titanMat = new THREE.MeshStandardMaterial({ color: 0x1e1b4b, roughness: 0.3 });
          const titan = new THREE.Mesh(new THREE.DodecahedronGeometry(3.0), titanMat);
          titan.position.y = 3.2;
          titan.castShadow = true;
          group.add(titan);

          const crystMat = new THREE.MeshStandardMaterial({ color: 0xc084fc, emissive: 0xa855f7, emissiveIntensity: 0.8 });
          const c1 = new THREE.Mesh(new THREE.OctahedronGeometry(1.2), crystMat);
          c1.position.set(-2.5, 4.5, 0);
          group.add(c1);
          const c2 = new THREE.Mesh(new THREE.OctahedronGeometry(1.2), crystMat);
          c2.position.set(2.5, 4.5, 0);
          group.add(c2);
        } else if (bossType === 'ignis') {
          // Magma Drake Ignis
          const magmaMat = new THREE.MeshStandardMaterial({ color: 0x7f1d1d, emissive: 0xef4444, emissiveIntensity: 0.5 });
          const drake = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 2.8, 5.0, 10), magmaMat);
          drake.position.y = 2.8;
          group.add(drake);
        } else {
          // Lord Malakor (Shadow Sovereign)
          const shadowMat = new THREE.MeshStandardMaterial({ color: 0x09090b, roughness: 0.2 });
          const malakor = new THREE.Mesh(new THREE.ConeGeometry(2.5, 6.0, 8), shadowMat);
          malakor.position.y = 3.0;
          group.add(malakor);

          // Void Singularity Core
          const voidMat = new THREE.MeshBasicMaterial({ color: 0xa855f7 });
          const voidCore = new THREE.Mesh(new THREE.SphereGeometry(1.2, 16, 16), voidMat);
          voidCore.position.set(0, 3.8, 0);
          group.add(voidCore);
        }
        break;
      }

      // Projectiles
      case 'projectile_player': {
        const fireMat = new THREE.MeshBasicMaterial({ color: 0xf97316 });
        const proj = new THREE.Mesh(new THREE.SphereGeometry(0.6, 8, 8), fireMat);
        group.add(proj);
        break;
      }

      case 'projectile_enemy': {
        const shadowMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
        const proj = new THREE.Mesh(new THREE.SphereGeometry(0.7, 8, 8), shadowMat);
        group.add(proj);
        break;
      }
    }

    return group;
  }

  // --- 3D MILO ANIMATION & TRANSFORMATION ---
  public updateMilo(player: any, stats: PlayerStats, time: number) {
    const posX = (player.x + player.width / 2) * SCALE_3D;
    const posY = -(player.y + player.height) * SCALE_3D;

    this.miloGroup.position.set(posX, posY, 0);
    this.playerPointLight.position.set(posX, posY + 2, 2.5);

    // Facing Direction
    if (player.facing === -1) {
      this.miloGroup.rotation.y = -Math.PI / 2;
    } else {
      this.miloGroup.rotation.y = Math.PI / 2;
    }

    // Power-Up Accessories Visibility & Tunic Tint
    const isFeather = stats.activePowerUp === 'wind_feather';
    const isStone = stats.activePowerUp === 'stone_heart';
    const isLightning = stats.activePowerUp === 'lightning_bloom';
    const isEmber = stats.activePowerUp === 'ember_core';

    this.miloWings.visible = isFeather;
    this.miloStoneCrags.visible = isStone;
    this.miloLightningRing.visible = isLightning;
    this.miloFireAura.visible = isEmber;

    if (isLightning) {
      this.miloLightningRing.rotation.z = time * 6;
    }
    if (isEmber) {
      this.miloFireAura.rotation.y = time * 4;
    }

    // Procedural Skeletal Animation
    const speed = Math.abs(player.vx);
    const isMoving = speed > 0.2;

    if (player.isGroundPounding) {
      // Ground pound dive
      this.miloGroup.rotation.x = Math.PI / 2;
      this.miloLeftArm.rotation.x = Math.PI;
      this.miloRightArm.rotation.x = Math.PI;
      this.miloLeftLeg.rotation.x = 0;
      this.miloRightLeg.rotation.x = 0;
    } else if (!player.isGrounded) {
      // In Air / Jump / Double Jump
      this.miloGroup.rotation.x = 0;
      const jumpProgress = Math.sin(time * 10);
      this.miloLeftLeg.rotation.x = 0.5;
      this.miloRightLeg.rotation.x = -0.5;
      this.miloLeftArm.rotation.x = -1.2;
      this.miloRightArm.rotation.x = -1.2;

      // Scarf blown upwards by wind
      for (let i = 0; i < this.miloScarfSegments.length; i++) {
        this.miloScarfSegments[i].position.y = -0.1 + i * 0.15;
      }
    } else if (isMoving) {
      // Running Cycle
      this.miloGroup.rotation.x = 0;
      const runFreq = speed * 4.5;
      const legAngle = Math.sin(time * runFreq) * 0.8;
      this.miloLeftLeg.rotation.x = legAngle;
      this.miloRightLeg.rotation.x = -legAngle;
      this.miloLeftArm.rotation.x = -legAngle;
      this.miloRightArm.rotation.x = legAngle;

      // Scarf trailing behind
      for (let i = 0; i < this.miloScarfSegments.length; i++) {
        this.miloScarfSegments[i].position.z = -0.7 - i * 0.55 + Math.sin(time * runFreq + i) * 0.15;
        this.miloScarfSegments[i].position.y = -0.1 - i * 0.12;
      }
    } else {
      // Idle Breathing
      this.miloGroup.rotation.x = 0;
      const breath = Math.sin(time * 3) * 0.05;
      this.miloBody.scale.set(1, 1 + breath, 1);
      this.miloLeftLeg.rotation.x = 0;
      this.miloRightLeg.rotation.x = 0;
      this.miloLeftArm.rotation.x = 0;
      this.miloRightArm.rotation.x = 0;
    }

    // Invulnerability Flicker
    if (player.invulnerableTimer > 0) {
      this.miloGroup.visible = Math.floor(time * 20) % 2 === 0;
    } else {
      this.miloGroup.visible = true;
    }

    // Air Dash Radial Cooldown Progress Ring Indicator
    const dashCooldown = player.dashCooldown || 0;
    const maxDashCooldown = 0.48;

    if (dashCooldown > 0) {
      this.miloDashCooldownSprite.visible = true;
      const progress = Math.min(1.0, Math.max(0.0, 1.0 - dashCooldown / maxDashCooldown));

      if (this.miloDashCtx) {
        const ctx = this.miloDashCtx;
        ctx.clearRect(0, 0, 128, 128);

        // Dark background circular track
        ctx.beginPath();
        ctx.arc(64, 64, 46, 0, Math.PI * 2);
        ctx.lineWidth = 10;
        ctx.strokeStyle = 'rgba(15, 23, 42, 0.75)';
        ctx.stroke();

        // Glowing cyan progress arc
        ctx.beginPath();
        ctx.arc(64, 64, 46, -Math.PI / 2, -Math.PI / 2 + progress * Math.PI * 2);
        ctx.lineWidth = 10;
        ctx.lineCap = 'round';
        ctx.strokeStyle = '#38bdf8';
        ctx.shadowColor = '#0284c7';
        ctx.shadowBlur = 12;
        ctx.stroke();

        // Tip glowing head dot
        const angle = -Math.PI / 2 + progress * Math.PI * 2;
        const hx = 64 + Math.cos(angle) * 46;
        const hy = 64 + Math.sin(angle) * 46;
        ctx.beginPath();
        ctx.arc(hx, hy, 6, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = '#38bdf8';
        ctx.shadowBlur = 14;
        ctx.fill();

        this.miloDashTexture.needsUpdate = true;
      }
      this.miloDashCooldownSprite.scale.set(2.4, 2.4, 1);
    } else if (this.prevDashCooldown > 0 && dashCooldown <= 0) {
      // Cooldown finished! Flash ready pulse
      this.dashReadyFlashTimer = 0.22;
      this.miloDashCooldownSprite.visible = true;
      if (this.miloDashCtx) {
        const ctx = this.miloDashCtx;
        ctx.clearRect(0, 0, 128, 128);
        ctx.beginPath();
        ctx.arc(64, 64, 46, 0, Math.PI * 2);
        ctx.lineWidth = 12;
        ctx.strokeStyle = '#67e8f9';
        ctx.shadowColor = '#38bdf8';
        ctx.shadowBlur = 20;
        ctx.stroke();
        this.miloDashTexture.needsUpdate = true;
      }
    } else if (this.dashReadyFlashTimer > 0) {
      this.dashReadyFlashTimer -= 0.016;
      const flashScale = 2.4 + (0.22 - this.dashReadyFlashTimer) * 4.0;
      this.miloDashCooldownSprite.scale.set(flashScale, flashScale, 1);
      if (dashCooldown <= 0 && this.dashReadyFlashTimer <= 0) {
        this.miloDashCooldownSprite.visible = false;
      }
    } else {
      this.miloDashCooldownSprite.visible = false;
    }

    this.prevDashCooldown = dashCooldown;
  }

  // --- 3D CAMERA DYNAMICS ---
  public updateCamera(camera: Camera, player: any) {
    const targetX = (player.x + player.width / 2) * SCALE_3D;
    const targetY = -(player.y + player.height / 2) * SCALE_3D;

    // High-impact multi-axis camera shake
    let shakeX = 0;
    let shakeY = 0;
    let shakeZ = 0;
    if (camera.shakeTime > 0) {
      const shakeIntensity = camera.shakeIntensity;
      const shakeDecay = Math.min(1.0, camera.shakeTime / 0.08);
      const shakeMag = shakeIntensity * shakeDecay * 0.12;
      const shakeAngle = Math.random() * Math.PI * 2;
      shakeX = Math.cos(shakeAngle) * shakeMag;
      shakeY = Math.sin(shakeAngle) * shakeMag;
      shakeZ = (Math.random() - 0.5) * shakeMag * 0.5;
    }

    if (this.cameraMode === 'action3d') {
      // Dynamic 3D Action Perspective (behind and elevated with smooth follow)
      const lookAhead = player.facing * 4.0;
      const desiredX = targetX - player.facing * 3.0 + shakeX;
      const desiredY = targetY + 6.0 + shakeY;
      const desiredZ = 24.0 + shakeZ;

      this.camera3D.position.x += (desiredX - this.camera3D.position.x) * 0.09;
      this.camera3D.position.y += (desiredY - this.camera3D.position.y) * 0.09;
      this.camera3D.position.z += (desiredZ - this.camera3D.position.z) * 0.09;

      this.camera3D.lookAt(targetX + lookAhead, targetY + 1.5, 0);
    } else if (this.cameraMode === 'diorama3d') {
      // Isometric 3D Adventure View (mirrored angle when in mirrorMode)
      const xOffset = this.mirrorMode ? -12.0 : 12.0;
      const desiredX = targetX + xOffset + shakeX;
      const desiredY = targetY + 14.0 + shakeY;
      const desiredZ = 28.0 + shakeZ;

      this.camera3D.position.x += (desiredX - this.camera3D.position.x) * 0.08;
      this.camera3D.position.y += (desiredY - this.camera3D.position.y) * 0.08;
      this.camera3D.position.z += (desiredZ - this.camera3D.position.z) * 0.08;

      this.camera3D.lookAt(targetX, targetY, 0);
    } else {
      // 2.5D Classic Platformer Perspective
      const desiredX = targetX + shakeX;
      const desiredY = targetY + 2.5 + shakeY;
      const desiredZ = 30.0 + shakeZ;

      this.camera3D.position.x += (desiredX - this.camera3D.position.x) * 0.1;
      this.camera3D.position.y += (desiredY - this.camera3D.position.y) * 0.1;
      this.camera3D.position.z = desiredZ;

      this.camera3D.lookAt(targetX, targetY + 2.0, 0);
    }

    // Direct Sunlight follows player (mirrored light angle in mirrorMode)
    const sunLightXOffset = this.mirrorMode ? -20 : 20;
    this.sunLight.position.set(this.camera3D.position.x + sunLightXOffset, this.camera3D.position.y + 35, 30);
    this.sunLight.target.position.set(targetX, targetY, 0);
    this.sunLight.target.updateMatrixWorld();
  }

  // --- 3D PARTICLES & COMBAT EFFECTS ---
  public updateParticles(particles: Particle[]) {
    // Clear old particle meshes
    while (this.particleGroup.children.length > 0) {
      this.particleGroup.children.pop();
    }

    const partGeo = new THREE.OctahedronGeometry(0.3, 0);
    const smokeGeo = new THREE.SphereGeometry(0.4, 8, 8);

    for (const p of particles) {
      const posX = p.x * SCALE_3D;
      const posY = -p.y * SCALE_3D;
      const posZ = (Math.random() - 0.5) * 1.5;

      const mat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(p.color),
        emissive: new THREE.Color(p.color),
        emissiveIntensity: p.shape === 'star' || p.shape === 'spark' ? 0.8 : 0.1,
        transparent: true,
        opacity: p.alpha * (p.shape === 'smoke' ? 0.85 : 1.0),
        roughness: 0.5,
      });

      const isSmoke = p.shape === 'smoke';
      const mesh = new THREE.Mesh(isSmoke ? smokeGeo : partGeo, mat);
      mesh.position.set(posX, posY, posZ);

      if (isSmoke) {
        // Expanding soft puffy dust cloud
        const growth = 0.75 + (p.life / p.maxLife) * 1.6;
        const s = (p.size / 4) * growth;
        mesh.scale.set(s, s * 0.85, s);
      } else {
        const s = (p.size / 4) * (1 - p.life / p.maxLife);
        mesh.scale.set(s, s, s);
        mesh.rotation.x += p.life * 4;
        mesh.rotation.y += p.life * 6;
      }
      this.particleGroup.add(mesh);
    }
  }

  // --- 3D SCORE POP-UP & FLOATING VISUAL EFFECTS ---
  public updateVisualEffects(visualEffects: VisualEffect[]) {
    while (this.effectsGroup.children.length > 0) {
      this.effectsGroup.children.pop();
    }

    if (!visualEffects || visualEffects.length === 0) return;

    for (const fx of visualEffects) {
      if (fx.type === 'float_text' && fx.text) {
        const textCanvas = document.createElement('canvas');
        textCanvas.width = 384;
        textCanvas.height = 96;
        const ctx = textCanvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, 384, 96);
          ctx.font = '900 36px "Fredoka", "Nunito", sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';

          // Outer dark border stroke
          ctx.strokeStyle = '#090d16';
          ctx.lineWidth = 10;
          ctx.lineJoin = 'round';
          ctx.miterLimit = 2;
          ctx.strokeText(fx.text, 192, 48);

          // Glow shadow
          ctx.shadowColor = fx.color || '#fde047';
          ctx.shadowBlur = 14;

          // Inner fill
          ctx.fillStyle = fx.color || '#fde047';
          ctx.fillText(fx.text, 192, 48);
        }

        const texture = new THREE.CanvasTexture(textCanvas);
        const progress = fx.life / fx.maxLife;
        const mat = new THREE.SpriteMaterial({
          map: texture,
          transparent: true,
          opacity: Math.max(0, 1.0 - progress),
          depthWrite: false,
        });

        const sprite = new THREE.Sprite(mat);
        const posX = fx.x * SCALE_3D;
        const posY = -(fx.y * SCALE_3D) + progress * 3.2 + 0.5;
        const posZ = 1.8;
        sprite.position.set(posX, posY, posZ);

        // Bouncy pop-in scale
        const pop = Math.sin(progress * Math.PI) * 0.4 + 1.0;
        sprite.scale.set(4.2 * pop, 1.05 * pop, 1);

        this.effectsGroup.add(sprite);
      }
    }
  }

  // --- HIGH-PERFORMANCE BLOB SHADOWS ---
  public updateBlobShadows(shadows: BlobShadowData[]) {
    const activeIds = new Set<string>();

    for (const s of shadows) {
      activeIds.add(s.id);
      let mesh = this.blobShadowMap.get(s.id);

      if (!mesh) {
        const geo = new THREE.PlaneGeometry(1, 1);
        const mat = new THREE.MeshBasicMaterial({
          map: this.blobShadowTexture,
          transparent: true,
          opacity: 0.75,
          depthWrite: false,
        });
        mesh = new THREE.Mesh(geo, mat);
        mesh.rotation.x = -Math.PI / 2;
        this.blobShadowMap.set(s.id, mesh);
        this.shadowGroup.add(mesh);
      }

      const posX = s.x * SCALE_3D;
      const posY = -(s.floorY * SCALE_3D) + 0.05; // Sit flush just above the platform
      mesh.position.set(posX, posY, 0);

      // Scale and fade dynamically with altitude
      const maxAlt = 220; // Max altitude before shadow fades completely
      const altRatio = Math.max(0, Math.min(1.0, 1.0 - s.altitude / maxAlt));
      const scaleX = s.baseWidth * SCALE_3D * (0.35 + 0.65 * altRatio);
      const scaleZ = scaleX * 0.68; // Elliptical ground projection
      mesh.scale.set(scaleX, scaleZ, 1);

      const mat = mesh.material as THREE.MeshBasicMaterial;
      mat.opacity = Math.max(0, 0.75 * Math.pow(altRatio, 1.3));
      mesh.visible = s.altitude < maxAlt && mat.opacity > 0.01;
    }

    // Clean up inactive entity shadows
    for (const [id, mesh] of this.blobShadowMap.entries()) {
      if (!activeIds.has(id)) {
        this.shadowGroup.remove(mesh);
        this.blobShadowMap.delete(id);
      }
    }
  }

  // --- POST-PROCESSING MOTION BLUR & SPEED LINES UPDATE ---
  public updateMotionBlur(
    player: { x: number; y: number; vx: number; vy: number; isDashing?: boolean; isGroundPounding?: boolean; isGliding?: boolean },
    stats: PlayerStats,
    gameTime: number = 0
  ) {
    if (!this.motionBlurPass) return;

    const vx = player.vx;
    const vy = player.vy;
    const speed = Math.sqrt(vx * vx + vy * vy);
    const isDashing = !!player.isDashing;
    const isGroundPounding = !!player.isGroundPounding;
    const isLightning = stats.activePowerUp === 'lightning_bloom';

    // Target blur and speed lines strength based on movement velocity
    let targetStrength = 0.0;
    let targetRadialStrength = 0.0;
    let targetChromatic = 0.0;
    let targetSpeedLines = 0.0;

    // Dash gives high punchy motion blur, chromatic warp, & intense speed lines
    if (isDashing) {
      targetStrength = 0.95;
      targetRadialStrength = 0.85;
      targetChromatic = 0.9;
      targetSpeedLines = 0.95;
    } else if (isGroundPounding) {
      targetStrength = 0.75;
      targetRadialStrength = 0.55;
      targetChromatic = 0.45;
      targetSpeedLines = 0.65;
    } else if (isLightning && speed > 4.5) {
      const ratio = Math.min(1.0, (speed - 4.5) / 4.5);
      targetStrength = 0.55 * ratio;
      targetRadialStrength = 0.48 * ratio;
      targetChromatic = 0.5 * ratio;
      targetSpeedLines = 0.6 * ratio;
    } else if (speed > 5.2) {
      // Fast sprint or spring bounce
      const ratio = Math.min(1.0, (speed - 5.2) / 5.0);
      targetStrength = 0.4 * ratio;
      targetRadialStrength = 0.3 * ratio;
      targetChromatic = 0.25 * ratio;
      targetSpeedLines = 0.55 * ratio;
    }

    // Smooth lerp so blur and speed lines ramp in snappy and fade out smoothly
    const lerpFactor = targetStrength > this.currentBlurStrength ? 0.38 : 0.16;
    this.currentBlurStrength += (targetStrength - this.currentBlurStrength) * lerpFactor;
    this.currentRadialStrength += (targetRadialStrength - this.currentRadialStrength) * lerpFactor;
    this.currentChromatic += (targetChromatic - this.currentChromatic) * lerpFactor;
    this.currentSpeedLinesStrength += (targetSpeedLines - this.currentSpeedLinesStrength) * (targetSpeedLines > this.currentSpeedLinesStrength ? 0.36 : 0.18);

    // Screen-space velocity vector (vx > 0 is moving right, vy > 0 in 2D is moving downward)
    const dirX = speed > 0.01 ? (vx / speed) : 0;
    const dirY = speed > 0.01 ? (-vy / speed) : 0; // inverted for screen UV coordinates

    this.motionBlurPass.uniforms.uVelocity.value.set(dirX, dirY);
    this.motionBlurPass.uniforms.uStrength.value = this.currentBlurStrength;
    this.motionBlurPass.uniforms.uRadialStrength.value = this.currentRadialStrength;
    this.motionBlurPass.uniforms.uChromaticAberration.value = this.currentChromatic;
    this.motionBlurPass.uniforms.uSpeedLinesStrength.value = this.currentSpeedLinesStrength;
    this.motionBlurPass.uniforms.uTime.value = gameTime;

    // Health Edge Glow & Damage Pulse
    const healthPercent = stats.maxHealth > 0 ? Math.max(0, Math.min(1.0, stats.health / stats.maxHealth)) : 1.0;
    this.motionBlurPass.uniforms.uHealthPercent.value = healthPercent;
    this.motionBlurPass.uniforms.uDamageFlash.value = stats.damageFlashTimer || 0;
    this.motionBlurPass.uniforms.uLowHealthPulse.value = Math.sin(gameTime * 7.5) * 0.5 + 0.5;

    // Project Milo's 3D coordinates to normalized screen UV coords
    const milo3DPos = new THREE.Vector3(player.x * SCALE_3D, -(player.y + 15) * SCALE_3D, 0);
    milo3DPos.project(this.camera3D);
    const screenUvX = (milo3DPos.x + 1) * 0.5;
    const screenUvY = (milo3DPos.y + 1) * 0.5;

    this.motionBlurPass.uniforms.uCenter.value.set(
      Math.max(0.02, Math.min(0.98, screenUvX)),
      Math.max(0.02, Math.min(0.98, screenUvY))
    );
  }

  // --- RENDER FRAME ---
  public render() {
    this.composer.render();
  }

  public destroy() {
    this.renderer.dispose();
  }
}
