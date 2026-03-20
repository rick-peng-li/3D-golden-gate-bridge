import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// 金门大桥 3D 模拟 - 真实细节版本
class GoldenGateBridge {
    constructor() {
        this.container = document.getElementById('canvas-container');
        this.loading = document.getElementById('loading');
        
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        
        this.time = 0;
        
        // 真实比例参数 (米)
        this.scale = 0.012;
        this.towerHeight = 227 * this.scale;      // 桥塔高度
        this.towerWidthAtBase = 16 * this.scale;  // 塔底宽度
        this.towerWidthAtTop = 9 * this.scale;    // 塔顶宽度
        this.towerDepth = 24 * this.scale;        // 塔深度
        this.spanLength = 1280 * this.scale;      // 主跨
        this.sideSpanLength = 343 * this.scale;   // 侧跨
        this.deckWidth = 27 * this.scale;         // 桥面宽
        this.deckHeight = 67 * this.scale;        // 桥面高度
        this.cableSag = 152 * this.scale;         // 主缆垂度
        
        this.init();
    }
    
    init() {
        this.createScene();
        this.createCamera();
        this.createRenderer();
        this.createControls();
        this.createLighting();
        this.createWater();
        this.createBridge();
        this.animate();
        
        setTimeout(() => {
            this.loading.style.opacity = '0';
        }, 1000);
        
        window.addEventListener('resize', () => this.onWindowResize());
    }
    
    createScene() {
        this.scene = new THREE.Scene();
        // 旧金山海湾的天空色
        this.scene.background = new THREE.Color(0xB8D4E3);
        this.scene.fog = new THREE.Fog(0xB8D4E3, 80, 400);
    }
    
    createCamera() {
        const aspect = window.innerWidth / window.innerHeight;
        this.camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 3000);
        // 经典视角 - 从东南方向看大桥
        this.camera.position.set(
            this.spanLength * 0.6,
            this.towerHeight * 0.5,
            this.spanLength * 1.1
        );
    }
    
    createRenderer() {
        this.renderer = new THREE.WebGLRenderer({ 
            antialias: true,
            powerPreference: 'high-performance'
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.1;
        this.container.appendChild(this.renderer.domElement);
    }
    
    createControls() {
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.minDistance = 30;
        this.controls.maxDistance = 300;
        this.controls.maxPolarAngle = Math.PI / 2 - 0.02;
        this.controls.target.set(0, this.deckHeight + this.towerHeight * 0.25, 0);
    }
    
    createLighting() {
        // 环境光
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
        this.scene.add(ambientLight);
        
        // 主阳光
        const sunLight = new THREE.DirectionalLight(0xfff8e7, 2.0);
        sunLight.position.set(100, 150, 80);
        sunLight.castShadow = true;
        sunLight.shadow.mapSize.width = 4096;
        sunLight.shadow.mapSize.height = 4096;
        sunLight.shadow.camera.near = 0.5;
        sunLight.shadow.camera.far = 600;
        const d = 150;
        sunLight.shadow.camera.left = -d;
        sunLight.shadow.camera.right = d;
        sunLight.shadow.camera.top = d;
        sunLight.shadow.camera.bottom = -d;
        sunLight.shadow.bias = -0.0001;
        this.scene.add(sunLight);
        
        // 补光
        const fillLight = new THREE.DirectionalLight(0xc9e9f6, 0.6);
        fillLight.position.set(-80, 60, -80);
        this.scene.add(fillLight);
    }
    
    createWater() {
        const waterGeometry = new THREE.PlaneGeometry(1500, 1500);
        waterGeometry.rotateX(-Math.PI / 2);
        
        const waterMaterial = new THREE.MeshStandardMaterial({
            color: 0x2E5C8A,
            roughness: 0.05,
            metalness: 0.4,
            transparent: true,
            opacity: 0.95
        });
        
        this.waterMesh = new THREE.Mesh(waterGeometry, waterMaterial);
        this.waterMesh.position.y = -3;
        this.waterMesh.receiveShadow = true;
        this.scene.add(this.waterMesh);
    }
    
    createBridge() {
        // 创建锚碇
        this.createAnchorages();
        // 创建桥塔
        this.createTowers();
        // 创建主缆
        this.createMainCables();
        // 创建吊索
        this.createSuspenders();
        // 创建桥面桁架
        this.createTrussDeck();
    }
    
    createAnchorages() {
        // 金门大桥标志性的锚碇结构
        const anchorageMaterial = new THREE.MeshStandardMaterial({
            color: 0x8B7355,
            roughness: 0.9,
            metalness: 0.1
        });
        
        const positions = [
            -(this.spanLength / 2 + this.sideSpanLength + 20),
            (this.spanLength / 2 + this.sideSpanLength + 20)
        ];
        
        positions.forEach(xPos => {
            // 主锚碇体
            const anchorageGeometry = new THREE.BoxGeometry(25 * this.scale, 30 * this.scale, 40 * this.scale);
            const anchorage = new THREE.Mesh(anchorageGeometry, anchorageMaterial);
            anchorage.position.set(xPos, 10 * this.scale, 0);
            anchorage.castShadow = true;
            anchorage.receiveShadow = true;
            this.scene.add(anchorage);
            
            // 锚碇顶部平台
            const platformGeometry = new THREE.BoxGeometry(30 * this.scale, 5 * this.scale, 50 * this.scale);
            const platform = new THREE.Mesh(platformGeometry, anchorageMaterial);
            platform.position.set(xPos, 27 * this.scale, 0);
            platform.castShadow = true;
            this.scene.add(platform);
        });
    }
    
    createTowers() {
        // 金门大桥标志性的国际橙色
        const towerMaterial = new THREE.MeshStandardMaterial({
            color: 0xC0362C,
            roughness: 0.35,
            metalness: 0.35
        });
        
        const towerPositions = [-this.spanLength / 2, this.spanLength / 2];
        
        towerPositions.forEach(xPos => {
            const tower = this.createDetailedTower(towerMaterial);
            tower.position.set(xPos, this.deckHeight, 0);
            this.scene.add(tower);
        });
    }
    
    createDetailedTower(material) {
        const towerGroup = new THREE.Group();
        
        const legWidthBottom = 5.5 * this.scale;
        const legWidthTop = 3.5 * this.scale;
        const legDepth = this.towerDepth;
        const legSpacingBottom = 14 * this.scale;
        const legSpacingTop = 6 * this.scale;
        
        // 创建变宽塔腿 - 使用多个分段来模拟锥形
        const segments = 8;
        const segmentHeight = this.towerHeight / segments;
        
        for (let i = 0; i < segments; i++) {
            const t1 = i / segments;
            const t2 = (i + 1) / segments;
            
            const width1 = legWidthBottom + (legWidthTop - legWidthBottom) * t1;
            const width2 = legWidthBottom + (legWidthTop - legWidthBottom) * t2;
            const avgWidth = (width1 + width2) / 2;
            
            const spacing1 = legSpacingBottom + (legSpacingTop - legSpacingBottom) * t1;
            const spacing2 = legSpacingBottom + (legSpacingTop - legSpacingBottom) * t2;
            const avgSpacing = (spacing1 + spacing2) / 2;
            
            const yPos = i * segmentHeight + segmentHeight / 2;
            
            // 左塔腿分段
            const leftLegGeometry = new THREE.BoxGeometry(avgWidth, segmentHeight + 0.1, legDepth);
            const leftLeg = new THREE.Mesh(leftLegGeometry, material);
            leftLeg.position.set(-avgSpacing / 2, yPos, 0);
            leftLeg.castShadow = true;
            leftLeg.receiveShadow = true;
            towerGroup.add(leftLeg);
            
            // 右塔腿分段
            const rightLegGeometry = new THREE.BoxGeometry(avgWidth, segmentHeight + 0.1, legDepth);
            const rightLeg = new THREE.Mesh(rightLegGeometry, material);
            rightLeg.position.set(avgSpacing / 2, yPos, 0);
            rightLeg.castShadow = true;
            rightLeg.receiveShadow = true;
            towerGroup.add(rightLeg);
        }
        
        // 塔顶装饰 - Art Deco风格
        const topDecorHeight = 4 * this.scale;
        const topDecorWidth = this.towerWidthAtTop + 2 * this.scale;
        const topDecorGeometry = new THREE.BoxGeometry(topDecorWidth, topDecorHeight, legDepth + 2 * this.scale);
        const topDecor = new THREE.Mesh(topDecorGeometry, material);
        topDecor.position.set(0, this.towerHeight + topDecorHeight / 2, 0);
        topDecor.castShadow = true;
        towerGroup.add(topDecor);
        
        // 塔顶尖顶
        const pinnacleGeometry = new THREE.ConeGeometry(1.5 * this.scale, 6 * this.scale, 4);
        const pinnacleLeft = new THREE.Mesh(pinnacleGeometry, material);
        pinnacleLeft.position.set(-legSpacingTop / 2, this.towerHeight + topDecorHeight + 3 * this.scale, 0);
        towerGroup.add(pinnacleLeft);
        
        const pinnacleRight = new THREE.Mesh(pinnacleGeometry, material);
        pinnacleRight.position.set(legSpacingTop / 2, this.towerHeight + topDecorHeight + 3 * this.scale, 0);
        towerGroup.add(pinnacleRight);
        
        // 塔基 - 巨大的混凝土基础
        const baseHeight = this.deckHeight * 0.5;
        const baseWidth = this.towerWidthAtBase + 8 * this.scale;
        const baseDepth = this.towerDepth + 6 * this.scale;
        const baseGeometry = new THREE.BoxGeometry(baseWidth, baseHeight, baseDepth);
        const base = new THREE.Mesh(baseGeometry, material);
        base.position.set(0, -this.deckHeight + baseHeight / 2, 0);
        base.castShadow = true;
        base.receiveShadow = true;
        towerGroup.add(base);
        
        // 创建横梁
        this.addTowerCrossbeams(towerGroup, material, legSpacingBottom, legSpacingTop);
        
        // 添加X型支撑
        this.addXBracing(towerGroup, material, legSpacingBottom, legSpacingTop);
        
        return towerGroup;
    }
    
    addTowerCrossbeams(towerGroup, material, spacingBottom, spacingTop) {
        // 金门大桥有6层横梁
        const crossbeamLevels = [0.15, 0.32, 0.50, 0.68, 0.85, 0.96];
        
        crossbeamLevels.forEach(level => {
            const yPos = this.towerHeight * level;
            const t = level;
            const currentSpacing = spacingBottom + (spacingTop - spacingBottom) * t;
            
            // 横梁主体
            const beamHeight = 3 * this.scale;
            const beamDepth = this.towerDepth * 0.85;
            const beamGeometry = new THREE.BoxGeometry(currentSpacing * 0.9, beamHeight, beamDepth);
            const beam = new THREE.Mesh(beamGeometry, material);
            beam.position.set(0, yPos, 0);
            beam.castShadow = true;
            beam.receiveShadow = true;
            towerGroup.add(beam);
            
            // 横梁两端的装饰
            const capSize = 4 * this.scale;
            const capGeometry = new THREE.BoxGeometry(capSize, beamHeight * 1.2, beamDepth * 1.1);
            
            const leftCap = new THREE.Mesh(capGeometry, material);
            leftCap.position.set(-currentSpacing / 2, yPos, 0);
            leftCap.castShadow = true;
            towerGroup.add(leftCap);
            
            const rightCap = new THREE.Mesh(capGeometry, material);
            rightCap.position.set(currentSpacing / 2, yPos, 0);
            rightCap.castShadow = true;
            towerGroup.add(rightCap);
        });
    }
    
    addXBracing(towerGroup, material, spacingBottom, spacingTop) {
        // 在横梁之间添加X型支撑结构
        const bracingLevels = [
            { bottom: 0.15, top: 0.32 },
            { bottom: 0.32, top: 0.50 },
            { bottom: 0.50, top: 0.68 },
            { bottom: 0.68, top: 0.85 }
        ];
        
        const bracingMaterial = new THREE.MeshStandardMaterial({
            color: 0xC0362C,
            roughness: 0.4,
            metalness: 0.3
        });
        
        bracingLevels.forEach(range => {
            const yBottom = this.towerHeight * range.bottom + 2 * this.scale;
            const yTop = this.towerHeight * range.top - 2 * this.scale;
            const yMid = (yBottom + yTop) / 2;
            const height = yTop - yBottom;
            
            const t = range.bottom + (range.top - range.bottom) / 2;
            const currentSpacing = spacingBottom + (spacingTop - spacingBottom) * t;
            
            // X型支撑 - 使用圆柱体
            const braceRadius = 0.4 * this.scale;
            
            // 左X
            const leftX1Geometry = new THREE.CylinderGeometry(braceRadius, braceRadius, 
                Math.sqrt(Math.pow(height, 2) + Math.pow(currentSpacing * 0.35, 2)), 6);
            const leftX1 = new THREE.Mesh(leftX1Geometry, bracingMaterial);
            leftX1.position.set(-currentSpacing * 0.175, yMid, 0);
            leftX1.rotation.z = Math.atan2(currentSpacing * 0.35, height);
            towerGroup.add(leftX1);
            
            const leftX2 = new THREE.Mesh(leftX1Geometry, bracingMaterial);
            leftX2.position.set(-currentSpacing * 0.175, yMid, 0);
            leftX2.rotation.z = -Math.atan2(currentSpacing * 0.35, height);
            towerGroup.add(leftX2);
            
            // 右X
            const rightX1 = new THREE.Mesh(leftX1Geometry, bracingMaterial);
            rightX1.position.set(currentSpacing * 0.175, yMid, 0);
            rightX1.rotation.z = -Math.atan2(currentSpacing * 0.35, height);
            towerGroup.add(rightX1);
            
            const rightX2 = new THREE.Mesh(leftX1Geometry, bracingMaterial);
            rightX2.position.set(currentSpacing * 0.175, yMid, 0);
            rightX2.rotation.z = Math.atan2(currentSpacing * 0.35, height);
            towerGroup.add(rightX2);
        });
    }
    
    createMainCables() {
        const cableMaterial = new THREE.MeshStandardMaterial({
            color: 0xB03020,
            roughness: 0.5,
            metalness: 0.25
        });
        
        // 主缆由多股小缆组成
        const mainCableRadius = 0.6 * this.scale;
        const bundleRadius = 2.5 * this.scale;
        
        // 创建主缆路径点
        const createCableCurve = (startX, towerX, endX, isSideSpan) => {
            const towerY = this.deckHeight + this.towerHeight - 5 * this.scale;
            const points = [];
            
            if (!isSideSpan) {
                // 主跨
                points.push(new THREE.Vector3(startX, towerY, 0));
                points.push(new THREE.Vector3(towerX + (endX - towerX) * 0.25, towerY - this.cableSag * 0.5, 0));
                points.push(new THREE.Vector3((towerX + endX) / 2, towerY - this.cableSag, 0));
                points.push(new THREE.Vector3(endX - (endX - towerX) * 0.25, towerY - this.cableSag * 0.5, 0));
                points.push(new THREE.Vector3(endX, towerY, 0));
            } else {
                // 侧跨
                const endY = this.deckHeight + 8 * this.scale;
                points.push(new THREE.Vector3(startX, towerY, 0));
                points.push(new THREE.Vector3(startX + (endX - startX) * 0.5, 
                    (towerY + endY) / 2 + 10 * this.scale, 0));
                points.push(new THREE.Vector3(endX, endY, 0));
            }
            
            return new THREE.CatmullRomCurve3(points);
        };
        
        // 主跨缆
        const mainCurve = createCableCurve(
            -this.spanLength / 2, 
            -this.spanLength / 2, 
            this.spanLength / 2,
            false
        );
        
        // 创建多股主缆效果
        const cablePositions = [
            [0, 0],
            [0.8, 0],
            [-0.8, 0],
            [0, 0.8],
            [0, -0.8],
            [0.6, 0.6],
            [-0.6, 0.6],
            [0.6, -0.6],
            [-0.6, -0.6]
        ];
        
        cablePositions.forEach(([dx, dz]) => {
            const offset = new THREE.Vector3(dx * this.scale, 0, dz * this.scale);
            const cableGeometry = new THREE.TubeGeometry(mainCurve, 100, mainCableRadius, 8, false);
            
            // 偏移顶点
            const positions = cableGeometry.attributes.position.array;
            for (let i = 0; i < positions.length; i += 3) {
                positions[i] += offset.x;
                positions[i + 2] += offset.z;
            }
            cableGeometry.computeVertexNormals();
            
            const cable = new THREE.Mesh(cableGeometry, cableMaterial);
            cable.castShadow = true;
            this.scene.add(cable);
        });
        
        // 侧跨缆
        const leftCurve = createCableCurve(
            -this.spanLength / 2,
            -this.spanLength / 2,
            -this.spanLength / 2 - this.sideSpanLength,
            true
        );
        
        const rightCurve = createCableCurve(
            this.spanLength / 2,
            this.spanLength / 2,
            this.spanLength / 2 + this.sideSpanLength,
            true
        );
        
        // 侧跨使用较细的缆
        const sideCableRadius = 0.4 * this.scale;
        
        [leftCurve, rightCurve].forEach(curve => {
            const cableGeometry = new THREE.TubeGeometry(curve, 60, sideCableRadius, 8, false);
            const cable = new THREE.Mesh(cableGeometry, cableMaterial);
            cable.castShadow = true;
            this.scene.add(cable);
        });
    }
    
    createSuspenders() {
        const suspenderMaterial = new THREE.MeshStandardMaterial({
            color: 0xC0362C,
            roughness: 0.5,
            metalness: 0.2
        });
        
        const suspenderRadius = 0.12 * this.scale;
        const numSuspenders = 80;
        
        // 主跨吊索
        for (let i = 1; i < numSuspenders; i++) {
            const t = i / numSuspenders;
            const x = (t - 0.5) * this.spanLength;
            
            const cableHeight = this.deckHeight + this.towerHeight - 5 * this.scale - this.cableSag - 
                4 * this.cableSag * Math.pow(t - 0.5, 2);
            
            const suspenderHeight = cableHeight - this.deckHeight - 3 * this.scale;
            
            if (suspenderHeight > 0.5) {
                const suspenderGeometry = new THREE.CylinderGeometry(
                    suspenderRadius, suspenderRadius, suspenderHeight, 6
                );
                const suspender = new THREE.Mesh(suspenderGeometry, suspenderMaterial);
                suspender.position.set(x, this.deckHeight + 1.5 * this.scale + suspenderHeight / 2, 0);
                suspender.castShadow = true;
                this.scene.add(suspender);
            }
        }
        
        // 侧跨吊索
        const numSideSuspenders = 24;
        
        [-1, 1].forEach(direction => {
            for (let i = 1; i < numSideSuspenders; i++) {
                const t = i / numSideSuspenders;
                const x = direction * (this.spanLength / 2 + t * this.sideSpanLength);
                const cableHeight = this.deckHeight + (this.towerHeight - 5 * this.scale) * (1 - t * 0.7) + 5 * this.scale;
                const suspenderHeight = cableHeight - this.deckHeight - 3 * this.scale;
                
                if (suspenderHeight > 0.5) {
                    const suspenderGeometry = new THREE.CylinderGeometry(
                        suspenderRadius, suspenderRadius, suspenderHeight, 6
                    );
                    const suspender = new THREE.Mesh(suspenderGeometry, suspenderMaterial);
                    suspender.position.set(x, this.deckHeight + 1.5 * this.scale + suspenderHeight / 2, 0);
                    suspender.castShadow = true;
                    this.scene.add(suspender);
                }
            }
        });
    }
    
    createTrussDeck() {
        const deckGroup = new THREE.Group();
        
        // 桥面道路
        const roadMaterial = new THREE.MeshStandardMaterial({
            color: 0x555555,
            roughness: 0.8,
            metalness: 0.1
        });
        
        const totalLength = this.spanLength + 2 * this.sideSpanLength + 40 * this.scale;
        const roadGeometry = new THREE.BoxGeometry(totalLength, 1.5 * this.scale, this.deckWidth);
        const road = new THREE.Mesh(roadGeometry, roadMaterial);
        road.position.set(0, this.deckHeight, 0);
        road.castShadow = true;
        road.receiveShadow = true;
        deckGroup.add(road);
        
        // 桁架结构 - 金门大桥的标志性特征
        const trussMaterial = new THREE.MeshStandardMaterial({
            color: 0xC0362C,
            roughness: 0.4,
            metalness: 0.3
        });
        
        // 上弦杆
        const topChordGeometry = new THREE.BoxGeometry(totalLength, 1.5 * this.scale, 2 * this.scale);
        const topChordFront = new THREE.Mesh(topChordGeometry, trussMaterial);
        topChordFront.position.set(0, this.deckHeight + 4 * this.scale, -this.deckWidth / 2 + 1 * this.scale);
        topChordFront.castShadow = true;
        deckGroup.add(topChordFront);
        
        const topChordBack = new THREE.Mesh(topChordGeometry, trussMaterial);
        topChordBack.position.set(0, this.deckHeight + 4 * this.scale, this.deckWidth / 2 - 1 * this.scale);
        topChordBack.castShadow = true;
        deckGroup.add(topChordBack);
        
        // 下弦杆（护栏位置）
        const bottomChordGeometry = new THREE.BoxGeometry(totalLength, 2 * this.scale, 1.5 * this.scale);
        const bottomChordFront = new THREE.Mesh(bottomChordGeometry, trussMaterial);
        bottomChordFront.position.set(0, this.deckHeight + 1.5 * this.scale, -this.deckWidth / 2);
        bottomChordFront.castShadow = true;
        deckGroup.add(bottomChordFront);
        
        const bottomChordBack = new THREE.Mesh(bottomChordGeometry, trussMaterial);
        bottomChordBack.position.set(0, this.deckHeight + 1.5 * this.scale, this.deckWidth / 2);
        bottomChordBack.castShadow = true;
        deckGroup.add(bottomChordBack);
        
        // 竖杆
        const numVerticals = 60;
        const verticalSpacing = totalLength / numVerticals;
        
        for (let i = 0; i <= numVerticals; i++) {
            const x = -totalLength / 2 + i * verticalSpacing;
            
            // 前侧竖杆
            const verticalGeometry = new THREE.BoxGeometry(0.8 * this.scale, 4 * this.scale, 1 * this.scale);
            const verticalFront = new THREE.Mesh(verticalGeometry, trussMaterial);
            verticalFront.position.set(x, this.deckHeight + 2.5 * this.scale, -this.deckWidth / 2 + 1 * this.scale);
            verticalFront.castShadow = true;
            deckGroup.add(verticalFront);
            
            // 后侧竖杆
            const verticalBack = new THREE.Mesh(verticalGeometry, trussMaterial);
            verticalBack.position.set(x, this.deckHeight + 2.5 * this.scale, this.deckWidth / 2 - 1 * this.scale);
            verticalBack.castShadow = true;
            deckGroup.add(verticalBack);
            
            // X型斜撑
            if (i < numVerticals) {
                const nextX = -totalLength / 2 + (i + 1) * verticalSpacing;
                const midX = (x + nextX) / 2;
                const diagLength = Math.sqrt(Math.pow(verticalSpacing, 2) + Math.pow(4 * this.scale, 2));
                const angle = Math.atan2(4 * this.scale, verticalSpacing);
                
                const diagGeometry = new THREE.BoxGeometry(diagLength, 0.6 * this.scale, 0.4 * this.scale);
                
                // 前侧斜撑
                const diagFront1 = new THREE.Mesh(diagGeometry, trussMaterial);
                diagFront1.position.set(midX, this.deckHeight + 2.5 * this.scale, -this.deckWidth / 2 + 1 * this.scale);
                diagFront1.rotation.z = angle;
                deckGroup.add(diagFront1);
                
                const diagFront2 = new THREE.Mesh(diagGeometry, trussMaterial);
                diagFront2.position.set(midX, this.deckHeight + 2.5 * this.scale, -this.deckWidth / 2 + 1 * this.scale);
                diagFront2.rotation.z = -angle;
                deckGroup.add(diagFront2);
                
                // 后侧斜撑
                const diagBack1 = new THREE.Mesh(diagGeometry, trussMaterial);
                diagBack1.position.set(midX, this.deckHeight + 2.5 * this.scale, this.deckWidth / 2 - 1 * this.scale);
                diagBack1.rotation.z = angle;
                deckGroup.add(diagBack1);
                
                const diagBack2 = new THREE.Mesh(diagGeometry, trussMaterial);
                diagBack2.position.set(midX, this.deckHeight + 2.5 * this.scale, this.deckWidth / 2 - 1 * this.scale);
                diagBack2.rotation.z = -angle;
                deckGroup.add(diagBack2);
            }
        }
        
        // 横向连接
        const crossBraceGeometry = new THREE.BoxGeometry(1 * this.scale, 0.8 * this.scale, this.deckWidth - 4 * this.scale);
        for (let i = 0; i <= numVerticals; i += 2) {
            const x = -totalLength / 2 + i * verticalSpacing;
            const crossBrace = new THREE.Mesh(crossBraceGeometry, trussMaterial);
            crossBrace.position.set(x, this.deckHeight + 3 * this.scale, 0);
            deckGroup.add(crossBrace);
        }
        
        this.scene.add(deckGroup);
    }
    
    animate() {
        requestAnimationFrame(() => this.animate());
        
        this.time += 0.005;
        
        // 水面轻微波动
        if (this.waterMesh) {
            this.waterMesh.position.y = -3 + Math.sin(this.time) * 0.2;
        }
        
        this.controls.update();
        this.renderer.render(this.scene, this.camera);
    }
    
    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
}

// 初始化
new GoldenGateBridge();
