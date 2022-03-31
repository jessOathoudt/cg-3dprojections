// create a 4x4 matrix to the parallel projection / view matrix
function mat4x4Parallel(prp, srp, vup, clip) {
    // 1. translate PRP to origin
    // 2. rotate VRC such that (u,v,n) align with (x,y,z)
    // 3. shear such that CW is on the z-axis
    // 4. translate near clipping plane to origin
    // 5. scale such that view volume bounds are ([-1,1], [-1,1], [-1,0])

    // ...
    // let transform = Matrix.multiply([...]);
    // return transform;
}

// create a 4x4 matrix to the perspective projection / view matrix
function mat4x4Perspective(prp, srp, vup, clip) {

    // 1. translate PRP to origin
    Tper = new Matrix(4, 4)
    Mat4x4Translate(Tper, -(prp.x), -(prp.y), -(prp.z));


    // 2. rotate VRC such that (u,v,n) align with (x,y,z)
    //prp-srp
    let n = (Vector3(prp.x-srp.x, prp.y-srp.y, prp.z-srp.y));
    n.normalize();
    //vup * n
    let u = Vector3(vup.y*n.z - vup.z*n.y, vup.z*n.x-vup.x*n.z, vup.x*n.y-vup.y*n.x)
    u.normalize();
    //n * u
    let v = Vector3(n.y*u.z-n.x*u.y, n.z*u.x-n.x*u.z, n.x*u.y-n.y*u.x)
    u.normalize();
    Rper = new Matrix(4, 4)
    perRotate(Rper, n, u, v)

    // 3. shear such that CW is on the z-axis
    //left+right/2, top+bottom/2, -near
    let cw = Vector3((clip[0]+clip[1])/2, (clip[2]+clip[3])/2, -clip[4]);
    //prp is at the origin so cw-0,0,0
    let dop = cw
    SHper = new Matrix(4,4);
    Mat4x4ShearXY(SHper, (-dop.x/dop.z), (-dop.y/dop.z))


    // 4. scale such that view volume bounds are ([z,-z], [z,-z], [-1,zmin])
    Sper = new Matrix(4,4);

    Mat4x4Scale(Sper,(2*clip[4]/((clip[0]-clip[1])*clip[5])), (2*clip[4]/((clip[2]-clip[3])*clip[5])), 1/(clip[5]) )
    // ...

    //CLIP

    // let transform = Matrix.multiply([...]);
    let nPer = Matrix.multiply([Tper, Rper, SHper, Sper]);

    return nPer;
}

// create a 4x4 matrix to project a parallel image on the z=0 plane
function mat4x4MPar() {
    // 3D to 2D
    let mpar = new Matrix(4, 4);
    // mpar.values = ...;
    return mpar;
}

// create a 4x4 matrix to project a perspective image on the z=-1 plane
function mat4x4MPer() {
    let mper = new Matrix(4, 4);
    mper.values = [[1, 0, 0, 0],
                  [0, 1, 0, 0],
                  [0, 0, 1, 0],
                  [0, 0, -1, 0]];;
    return mper;
}



///////////////////////////////////////////////////////////////////////////////////
// 4x4 Transform Matrices                                                         //
///////////////////////////////////////////////////////////////////////////////////

// set values of existing 4x4 matrix to the identity matrix
function mat4x4Identity(mat4x4) {
    mat4x4.values = [[1, 0, 0, 0],
                     [0, 1, 0, 0],
                     [0, 0, 1, 0],
                     [0, 0, 0, 1]];
}

function perRotate(mat4x4, n, u, v) {

    mat4x4.values = [[u.x, u.y, u.z, 0],
                    [v.x, v.y, v.z, 0],
                    [n.x, n.y, n.z, 0],
                    [0, 0, 0, 1]];
}

// set values of existing 4x4 matrix to the translate matrix
function Mat4x4Translate(mat4x4, tx, ty, tz) {
    // mat4x4.values = ...;
        mat4x4.values = [[1, 0, 0, tx],
                        [0, 1, 0, ty],
                        [0, 0, 1, tz],
                        [0, 0, 0, 1]];
}

// set values of existing 4x4 matrix to the scale matrix
function Mat4x4Scale(mat4x4, sx, sy, sz) {
    mat4x4.values = [[sx, 0, 0, 0],
                    [0, sy, 0, 0],
                    [0, 0, sz, 0],
                    [0, 0, 0, 1]];
}

// set values of existing 4x4 matrix to the rotate about x-axis matrix
function Mat4x4RotateX(mat4x4, theta) {
    mat4x4.values = [[1, 0, 0, 0],
                    [0, Math.cos(theta), -Math.sin(theta), 0],
                    [1, Math.sin(theta), Math.cos(theta), 0],
                    [0, 0, 0, 1]];
    // mat4x4.values = ...;
}

// set values of existing 4x4 matrix to the rotate about y-axis matrix
function Mat4x4RotateY(mat4x4, theta) {
    // mat4x4.values = ...;
    mat4x4.values = [[Math.cos(theta), 0, Math.sin(theta), 0],
                    [0, 1, 0, 0],
                    [-Math.sin(theta), 0, Math.cos(theta), 0],
                    [0, 0, 0, 1]];
}

// set values of existing 4x4 matrix to the rotate about z-axis matrix
function Mat4x4RotateZ(mat4x4, theta) {
    // mat4x4.values = ...;
    mat4x4.values = [[Math.cos(theta), -Math.sin(theta), 0, 0],
                    [Math.sin(theta), Math.cos(theta), 0, 0],
                    [0, 0, 1, 0],
                    [0, 0, 0, 1]];
}

// set values of existing 4x4 matrix to the shear parallel to the xy-plane matrix
function Mat4x4ShearXY(mat4x4, shx, shy) {
    // mat4x4.values = ...;
    mat4x4.values = [[1, 0, shx, 0],
                    [0, 1, shy, 0],
                    [0, 0, 1, 0],
                    [0, 0, 0, 1]];
}

// create a new 3-component vector with values x,y,z
function Vector3(x, y, z) {
    let vec3 = new Vector(3);
    vec3.values = [x, y, z];
    return vec3;
}

// create a new 4-component vector with values x,y,z,w
function Vector4(x, y, z, w) {
    let vec4 = new Vector(4);
    vec4.values = [x, y, z, w];
    return vec4;
}