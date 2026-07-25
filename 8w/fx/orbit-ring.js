/* orbit-ring — 카드 둘레를 도는 비스듬한 additive 빛 고리.
   <a-entity orbit-ring="color:#cbb8ff; radius:0.95; tilt:72; spinMs:9000"> */
AFRAME.registerComponent('orbit-ring', {
  schema: { color: { type: 'color', default: '#cbb8ff' }, radius: { default: 0.95 },
            tube: { default: 0.02 }, tilt: { default: 72 }, spinMs: { default: 9000 } },
  init: function () {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(this.data.radius, this.data.tube, 12, 96),
      new THREE.MeshBasicMaterial({ color: new THREE.Color(this.data.color),
        blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, toneMapped: false })
    );
    ring.rotation.x = THREE.MathUtils.degToRad(this.data.tilt);
    const grp = new THREE.Group(); grp.add(ring);
    this.el.setObject3D('ring', grp); this.grp = grp;
    console.log('[orbit-ring] active');
  },
  tick: function (t) { if (this.grp) this.grp.rotation.y = (t / this.data.spinMs) * Math.PI * 2; },
  remove: function () { this.el.removeObject3D('ring'); }
});
