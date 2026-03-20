import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

const GoldenGateBridge = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const animationIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB);
    scene.fog = new THREE.Fog(0x87CEEB, 500, 2000);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      3000
    );
    camera.position.set(0, 300, 1000);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 1.5;
    controls.minDistance = 100;
    controls.maxDistance = 3000;
    controls.enablePan = true;
    controls.enableRotate = true;
    controls.enableZoom = true;
    controls.target.set(0, 100, 0);
    controls.update();
    controlsRef.current = controls;

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(500, 500, 500);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 2000;
    directionalLight.shadow.camera.left = -1000;
    directionalLight.shadow.camera.right = 1000;
    directionalLight.shadow.camera.top = 1000;
    directionalLight.shadow.camera.bottom = -1000;
    scene.add(directionalLight);

    const waterGeometry = new THREE.PlaneGeometry(5000, 5000);
    const waterMaterial = new THREE.MeshStandardMaterial({
      color: 0x1E90FF,
      metalness: 0.3,
      roughness: 0.4,
    });
    const water = new THREE.Mesh(waterGeometry, waterMaterial);
    water.rotation.x = -Math.PI / 2;
    water.position.y = -10;
    water.receiveShadow = true;
    scene.add(water);

    const bridgeGroup = new THREE.Group();

    const towerHeight = 227;
    const towerWidth = 25;
    const towerDepth = 20;
    const towerSpacing = 1280;
    const cableSag = 150;

    const towerMaterial = new THREE.MeshStandardMaterial({
      color: 0xB22222,
      metalness: 0.7,
      roughness: 0.3,
    });

    const createTower = (x: number) => {
      const towerGroup = new THREE.Group();

      const mainTowerGeometry = new THREE.BoxGeometry(towerWidth, towerHeight, towerDepth);
      const mainTower = new THREE.Mesh(mainTowerGeometry, towerMaterial);
      mainTower.position.y = towerHeight / 2;
      mainTower.castShadow = true;
      mainTower.receiveShadow = true;
      towerGroup.add(mainTower);

      const topBeamGeometry = new THREE.BoxGeometry(towerWidth * 1.5, 15, towerDepth * 1.5);
      const topBeam = new THREE.Mesh(topBeamGeometry, towerMaterial);
      topBeam.position.y = towerHeight + 7.5;
      topBeam.castShadow = true;
      towerGroup.add(topBeam);

      const lowerBeamGeometry = new THREE.BoxGeometry(towerWidth * 1.2, 10, towerDepth * 1.2);
      const lowerBeam = new THREE.Mesh(lowerBeamGeometry, towerMaterial);
      lowerBeam.position.y = towerHeight * 0.6;
      lowerBeam.castShadow = true;
      towerGroup.add(lowerBeam);

      const cableAnchorGeometry = new THREE.BoxGeometry(5, 5, 5);
      const cableAnchor = new THREE.Mesh(cableAnchorGeometry, towerMaterial);
      cableAnchor.position.y = towerHeight + 15;
      cableAnchor.castShadow = true;
      towerGroup.add(cableAnchor);

      towerGroup.position.x = x;
      return towerGroup;
    };

    const leftTower = createTower(-towerSpacing / 2);
    const rightTower = createTower(towerSpacing / 2);
    bridgeGroup.add(leftTower);
    bridgeGroup.add(rightTower);

    const cableMaterial = new THREE.MeshStandardMaterial({
      color: 0x696969,
      metalness: 0.9,
      roughness: 0.2,
    });

    const createMainCable = () => {
      const points: THREE.Vector3[] = [];
      const segments = 100;
      const halfWidth = towerSpacing / 2;

      for (let i = 0; i <= segments; i++) {
        const t = i / segments;
        const x = -halfWidth + t * towerSpacing;
        const y = towerHeight + 15 - cableSag * Math.sin(Math.PI * t);
        points.push(new THREE.Vector3(x, y, 0));
      }

      const curve = new THREE.CatmullRomCurve3(points);
      const tubeGeometry = new THREE.TubeGeometry(curve, segments, 2, 8, false);
      const cable = new THREE.Mesh(tubeGeometry, cableMaterial);
      cable.castShadow = true;
      return cable;
    };

    const mainCable = createMainCable();
    bridgeGroup.add(mainCable);

    const createHangerCables = () => {
      const hangerGroup = new THREE.Group();
      const hangerCount = 40;
      const halfWidth = towerSpacing / 2;

      for (let i = 1; i < hangerCount; i++) {
        const t = i / hangerCount;
        const x = -halfWidth + t * towerSpacing;
        const cableY = towerHeight + 15 - cableSag * Math.sin(Math.PI * t);
        const deckY = 30;

        const hangerGeometry = new THREE.CylinderGeometry(0.3, 0.3, cableY - deckY, 4);
        const hanger = new THREE.Mesh(hangerGeometry, cableMaterial);
        hanger.position.set(x, (cableY + deckY) / 2, 0);
        hanger.castShadow = true;
        hangerGroup.add(hanger);
      }

      return hangerGroup;
    };

    const hangerCables = createHangerCables();
    bridgeGroup.add(hangerCables);

    const deckMaterial = new THREE.MeshStandardMaterial({
      color: 0x2F4F4F,
      metalness: 0.5,
      roughness: 0.5,
    });

    const deckGeometry = new THREE.BoxGeometry(towerSpacing + 100, 15, 40);
    const deck = new THREE.Mesh(deckGeometry, deckMaterial);
    deck.position.y = 30;
    deck.castShadow = true;
    deck.receiveShadow = true;
    bridgeGroup.add(deck);

    const railingMaterial = new THREE.MeshStandardMaterial({
      color: 0xB22222,
      metalness: 0.7,
      roughness: 0.3,
    });

    const createRailing = (zOffset: number) => {
      const railingGroup = new THREE.Group();
      const postCount = 50;
      const postSpacing = (towerSpacing + 100) / postCount;

      for (let i = 0; i <= postCount; i++) {
        const x = -(towerSpacing + 100) / 2 + i * postSpacing;

        const postGeometry = new THREE.CylinderGeometry(1, 1, 30, 8);
        const post = new THREE.Mesh(postGeometry, railingMaterial);
        post.position.set(x, 45, zOffset);
        post.castShadow = true;
        railingGroup.add(post);

        if (i < postCount) {
          const railGeometry = new THREE.BoxGeometry(postSpacing, 3, 3);
          const topRail = new THREE.Mesh(railGeometry, railingMaterial);
          topRail.position.set(x + postSpacing / 2, 58, zOffset);
          topRail.castShadow = true;
          railingGroup.add(topRail);

          const middleRail = new THREE.Mesh(railGeometry, railingMaterial);
          middleRail.position.set(x + postSpacing / 2, 45, zOffset);
          middleRail.castShadow = true;
          railingGroup.add(middleRail);
        }
      }

      return railingGroup;
    };

    const leftRailing = createRailing(22);
    const rightRailing = createRailing(-22);
    bridgeGroup.add(leftRailing);
    bridgeGroup.add(rightRailing);

    scene.add(bridgeGroup);

    const createCloud = () => {
      const cloudGroup = new THREE.Group();
      const cloudMaterial = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.8,
      });

      for (let i = 0; i < 5; i++) {
        const size = 20 + Math.random() * 30;
        const cloudPartGeometry = new THREE.SphereGeometry(size, 8, 8);
        const cloudPart = new THREE.Mesh(cloudPartGeometry, cloudMaterial);
        cloudPart.position.set(
          (Math.random() - 0.5) * 100,
          Math.random() * 20,
          (Math.random() - 0.5) * 100
        );
        cloudGroup.add(cloudPart);
      }

      cloudGroup.position.set(
        (Math.random() - 0.5) * 2000,
        300 + Math.random() * 200,
        (Math.random() - 0.5) * 1000
      );

      return cloudGroup;
    };

    for (let i = 0; i < 20; i++) {
      const cloud = createCloud();
      scene.add(cloud);
    }

    const handleResize = () => {
      if (!cameraRef.current || !rendererRef.current) return;
      cameraRef.current.aspect = window.innerWidth / window.innerHeight;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('resize', handleResize);

    const keys = { w: false, a: false, s: false, d: false, q: false, e: false };
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (key in keys) {
        keys[key as keyof typeof keys] = true;
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (key in keys) {
        keys[key as keyof typeof keys] = false;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    const clock = new THREE.Clock();
    
    const animateScene = () => {
      animationIdRef.current = requestAnimationFrame(animateScene);
      
      const delta = clock.getDelta();
      
      if (cameraRef.current && controlsRef.current) {
        const speed = 200 * delta;
        const direction = new THREE.Vector3();
        cameraRef.current.getWorldDirection(direction);
        direction.y = 0;
        direction.normalize();
        
        const right = new THREE.Vector3();
        right.crossVectors(direction, new THREE.Vector3(0, 1, 0)).normalize();
        
        if (keys.w) {
          cameraRef.current.position.addScaledVector(direction, speed);
          controlsRef.current.target.addScaledVector(direction, speed);
        }
        if (keys.s) {
          cameraRef.current.position.addScaledVector(direction, -speed);
          controlsRef.current.target.addScaledVector(direction, -speed);
        }
        if (keys.a) {
          cameraRef.current.position.addScaledVector(right, -speed);
          controlsRef.current.target.addScaledVector(right, -speed);
        }
        if (keys.d) {
          cameraRef.current.position.addScaledVector(right, speed);
          controlsRef.current.target.addScaledVector(right, speed);
        }
        if (keys.q) {
          cameraRef.current.position.y += speed;
          controlsRef.current.target.y += speed;
        }
        if (keys.e) {
          cameraRef.current.position.y -= speed;
          controlsRef.current.target.y -= speed;
        }
        
        controlsRef.current.update();
        renderer.render(scene, cameraRef.current);
      }
    };

    animateScene();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
      if (rendererRef.current) {
        rendererRef.current.dispose();
      }
      if (containerRef.current && renderer.domElement) {
        containerRef.current.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden' }}>
      <div ref={containerRef} style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }} />
      <div style={{
        position: 'absolute',
        top: '20px',
        left: '20px',
        color: 'white',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        padding: '15px',
        borderRadius: '8px',
        fontFamily: 'Arial, sans-serif',
        fontSize: '14px',
        zIndex: 100,
        maxWidth: '300px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)'
      }}>
        <h3 style={{ margin: '0 0 10px 0', fontSize: '16px', borderBottom: '1px solid rgba(255,255,255,0.3)', paddingBottom: '8px' }}>金门大桥 3D 导航</h3>
        <p style={{ margin: '8px 0' }}><strong>鼠标控制:</strong></p>
        <p style={{ margin: '5px 0', paddingLeft: '10px' }}>• 左键拖动: 旋转视角</p>
        <p style={{ margin: '5px 0', paddingLeft: '10px' }}>• 右键拖动: 平移视角</p>
        <p style={{ margin: '5px 0', paddingLeft: '10px' }}>• 滚轮: 缩放</p>
        <p style={{ margin: '12px 0 8px 0' }}><strong>键盘控制:</strong></p>
        <p style={{ margin: '5px 0', paddingLeft: '10px' }}>• W/S: 前进/后退</p>
        <p style={{ margin: '5px 0', paddingLeft: '10px' }}>• A/D: 左移/右移</p>
        <p style={{ margin: '5px 0', paddingLeft: '10px' }}>• Q/E: 上升/下降</p>
      </div>
    </div>
  );
};

export default GoldenGateBridge;
