let view;
let ctx;
let scene;
let start_time;

const LEFT =   32; // binary 100000
const RIGHT =  16; // binary 010000
const BOTTOM = 8;  // binary 001000
const TOP =    4;  // binary 000100
const FAR =    2;  // binary 000010
const NEAR =   1;  // binary 000001
const FLOAT_EPSILON = 0.000001;

// Initialization function - called when web page loads
function init() {
    let w = 800;
    let h = 600;
    view = document.getElementById('view');
    view.width = w;
    view.height = h;

    ctx = view.getContext('2d');

    // initial scene... feel free to change this
    scene = {
        view: {
            type: 'perspective',
            prp: Vector3(44, 20, -16),//Vector3(44, 20, -16),
            srp: Vector3(20, 20, -40),//Vector3(20, 20, -40),
            vup: Vector3(0, 1, 0),//Vector3(0, 1, 0),
            clip: [-19, 5, -10, 8, 12, 100] //[-19, 5, -10, 8, 12, 100]
        },
        models: 
            {
                type: 'generic',
                vertices: [
                    Vector4( 0,  0, -30, 1),
                    Vector4(20,  0, -30, 1),
                    Vector4(20, 12, -30, 1),
                    Vector4(10, 20, -30, 1),
                    Vector4( 0, 12, -30, 1),
                    Vector4( 0,  0, -60, 1),
                    Vector4(20,  0, -60, 1),
                    Vector4(20, 12, -60, 1),
                    Vector4(10, 20, -60, 1),
                    Vector4( 0, 12, -60, 1)
                ],
                edges: [
                    [0, 1, 2, 3, 4, 0],
                    [5, 6, 7, 8, 9, 5],
                    [0, 5],
                    [1, 6],
                    [2, 7],
                    [3, 8],
                    [4, 9]
                ],
                //store rotation for animation
                matrix: new Matrix(4, 4)
            }
    };

    // event handler for pressing arrow keys
    document.addEventListener('keydown', onKeyDown, false);
    
    // start animation loop
    start_time = performance.now(); // current timestamp in milliseconds
    window.requestAnimationFrame(animate);
}

// Animation loop - repeatedly calls rendering code
function animate(timestamp) {
    // step 1: calculate time (time since start)
    let time = timestamp - start_time;
    
    // step 2: transform models based on time
    // TODO: implement this!

    // step 3: draw scene
    drawScene();

    // step 4: request next animation frame (recursively calling same function)
    // (may want to leave commented out while debugging initially)
    // window.requestAnimationFrame(animate);
}

// Main drawing code - use information contained in variable `scene`
function drawScene()
{
    let nPer = mat4x4Perspective(scene.view.prp, scene.view.srp, scene.view.vup, scene.view.clip);
    
    let V = new Matrix(4,4);
    V.values= ([view.width/2, 0, 0, view.width/2,
                0, view.height/2, 0, view.height/2,
                0, 0, 1, 0,
                0, 0, 0, 1]);
    //transform = good!
    
    for(let i=0; i<scene.models.edges.length; i++)
    {
        let edge = scene.models.edges[i];

        for (let j=0; j<edge.length-1; j++)
        {
            console.log("edge " + edge[j] + ", " + edge[j+1]);
            let pt0 = new Vector4(scene.models.vertices[edge[j]].x, scene.models.vertices[edge[j]].y, scene.models.vertices[edge[j]].z, scene.models.vertices[edge[j]].w);
            let pt1 = new Vector4(scene.models.vertices[edge[j+1]].x, scene.models.vertices[edge[j+1]].y, scene.models.vertices[edge[j+1]].z, scene.models.vertices[edge[j+1]].w);

            //multiplying new points by nPer
            let pt0New = Matrix.multiply([nPer, pt0]);
            let pt1New = Matrix.multiply([nPer, pt1]);

            pt0New.x = pt0New.x/pt0New.w;
            pt0New.y = pt0New.y/pt0New.w
            pt1New.x = pt1New.x/pt1New.w;
            pt1New.y = pt1New.y/pt1New.w;

            //clip
            let line = {"pt0": pt0New, "pt1": pt1New};
            let newLine = clipLinePerspective(line, scene.view.clip[4]);

            //multiply by mPer and scale to frame size
            if (newLine != null)
            {
                //multiply by mPer
                pt0New = Matrix.multiply([mat4x4MPer(), newLine.pt0]);
                pt1New = Matrix.multiply([mat4x4MPer(), newLine.pt1]);

                //scale to frame size                    
                pt0New = Matrix.multiply([V, pt0New]);
                pt1New = Matrix.multiply([V, pt1New]);
                
                //draw 2d line
                drawLine(pt0New.x, pt0New.y, pt1New.x, pt1New.y);
            }
            
        }
    }
}

// Get outcode for vertex (parallel view volume)
function outcodeParallel(vertex) {
    let outcode = 0;
    if (vertex.x < (-1.0 - FLOAT_EPSILON)) {
        outcode += LEFT;
    }
    else if (vertex.x > (1.0 + FLOAT_EPSILON)) {
        outcode += RIGHT;
    }
    if (vertex.y < (-1.0 - FLOAT_EPSILON)) {
        outcode += BOTTOM;
    }
    else if (vertex.y > (1.0 + FLOAT_EPSILON)) {
        outcode += TOP;
    }
    if (vertex.z < (-1.0 - FLOAT_EPSILON)) {
        outcode += FAR;
    }
    else if (vertex.z > (0.0 + FLOAT_EPSILON)) {
        outcode += NEAR;
    }
    return outcode;
}

// Get outcode for vertex (perspective view volume)
function outcodePerspective(vertex, z_min)
{
    let outcode = 0;
    if (vertex.x < (vertex.z - FLOAT_EPSILON)) {
        outcode += LEFT;
    }
    else if (vertex.x > (-vertex.z + FLOAT_EPSILON)) {
        outcode += RIGHT;
    }
    if (vertex.y < (vertex.z - FLOAT_EPSILON)) {
        outcode += BOTTOM;
    }
    else if (vertex.y > (-vertex.z + FLOAT_EPSILON)) {
        outcode += TOP;
    }
    if (vertex.z < (-1.0 - FLOAT_EPSILON)) {
        outcode += FAR;
    }
    else if (vertex.z > (z_min + FLOAT_EPSILON)) {
        outcode += NEAR;
    }
    return outcode;
}

// Clip line - should either return a new line (with two endpoints inside view volume) or null (if line is completely outside view volume)
function clipLineParallel(line)
{
    let result = null;
    let p0 = Vector3(line.pt0.x, line.pt0.y, line.pt0.z); 
    let p1 = Vector3(line.pt1.x, line.pt1.y, line.pt1.z);
    let out0 = outcodeParallel(p0);
    let out1 = outcodeParallel(p1);
    
    return result;
}

// Clip line - should either return a new line (with two endpoints inside view volume) or null (if line is completely outside view volume)
function clipLinePerspective(line, z_min)
{
    let result = null;

    //get outcodes
    let out0 = outcodePerspective(line.pt0, z_min);
    let out1 = outcodePerspective(line.pt1, z_min);

    
    //trivial accept
    if((out0 | out1) == 0)
    {
        result = line;
        console.log("accept");
    }
    //investigate further if not trivial reject
    else if((out0 & out1) == 0)
    {
        // console.log("not reject")
        let newPoint = getIntersectionPoint(out0, line, z_min); //get intersection point based on out0

        if (newPoint != null)
        {
            let newLine = line;
            newLine.pt0 = newPoint;
            newLine.pt1 = line.pt1;

            result = clipLinePerspective(newLine, z_min);
        }//update pt0 and make recursive call if pt0 is outside of view volume
        else
        {
            newPoint = getIntersectionPoint(out1, line, z_min);

            let newLine = line;
            newLine.pt0 = line.pt0;
            newLine.pt1 = newPoint;

            result = clipLinePerspective(newLine, z_min);
        }//update pt1 and make recursive call if pt0 is not outside of view volume
    }


    console.log(result)
    return result;
}

function getIntersectionPoint(outcode, line, z_min)
{
    t = null;
    dx = line.pt1.x - line.pt0.x;
    dy = line.pt1.y - line.pt0.y;
    dz = line.pt1.z - line.pt0.z;

    //calculate t based on outcode
    if ((outcode & LEFT) != 0)
    {
        t = (line.pt0.z - line.pt0.x) / (dx-dz);
    }
    else if ((outcode & RIGHT) != 0)
    {
        t = (line.pt0.x + line.pt0.z) / (dx + dx) * -1;
    }
    else if ((outcode & BOTTOM) != 0)
    {
        t = (line.pt0.z - line.pt0.y) / (dy - dz);
    }
    else if((outcode & TOP) != 0)
    {
        t = (line.pt0.y + line.pt0.z) / (dy + dz) * -1;
    }
    else if ((outcode & FAR) != 0)
    {
        t = -1 * (line.pt0.z + 1) / dz;
    }
    else if ((outcode & NEAR) != 0)
    {
        t = (z_min - line.pt0.z) / (-1 * dz);
    }

    if (t != null)
    {
        //calculate new intersectionPoint based on t
        let intersectionPoint = Vector4((1 - t) * line.pt0.x + t * line.pt1.x,
                                        (1 - t) * line.pt0.y + t * line.pt1.y,
                                        (1 - t) * line.pt0.z + t * line.pt1.z,
                                        line.pt0.w);

        return intersectionPoint;
    }
    else
    {
        //return null if no intersection point is found
        return null;
    }
}

// Called when user presses a key on the keyboard down 
function onKeyDown(event)
{
    let n = scene.view.prp.cross(scene.view.srp);
    n.normalize();
    let u = scene.view.vup.cross(n);
    u.normalize();
    let v = n.cross(u);
    v.normalize();
    console.log(n, u, v)
    
    switch (event.keyCode)
    {
        case 37: // LEFT Arrow
            console.log("left");
            break;
        case 39: // RIGHT Arrow


            console.log("right");
            break;
        case 65: // A key
            scene.view.prp.x = scene.view.prp.x + u.x;
            scene.view.srp.x = scene.view.srp.x + u.x;
            scene.view.prp.y = scene.view.prp.y + u.y;
            scene.view.srp.y = scene.view.srp.y + u.y;
            scene.view.prp.z = scene.view.prp.z + u.z;
            scene.view.srp.z = scene.view.srp.z + u.z;

            console.log("A");
            clearScene();
            drawScene();
            break;
        case 68: // D key
            scene.view.prp.x = scene.view.prp.x - u.x;
            scene.view.srp.x = scene.view.srp.x - u.x;
            scene.view.prp.y = scene.view.prp.y - u.y;
            scene.view.srp.y = scene.view.srp.y - u.y;
            scene.view.prp.z = scene.view.prp.z - u.z;
            scene.view.srp.z = scene.view.srp.z - u.z;
            
            console.log("D");
            clearScene();
            drawScene();
            break;
        case 83: // S key
            scene.view.prp.x = scene.view.prp.x - n.x;
            scene.view.srp.x = scene.view.srp.x - n.x;
            scene.view.prp.y = scene.view.prp.y - n.y;
            scene.view.srp.y = scene.view.srp.y - n.y;
            scene.view.prp.z = scene.view.prp.z - n.z;
            scene.view.srp.z = scene.view.srp.z - n.z;

            console.log("S");
            clearScene();
            drawScene();
            break;
        case 87: // W key
            scene.view.prp.x = scene.view.prp.x + n.x;
            scene.view.srp.x = scene.view.srp.x + n.x;
            scene.view.prp.y = scene.view.prp.y + n.y;
            scene.view.srp.y = scene.view.srp.y + n.y;
            scene.view.prp.z = scene.view.prp.z + n.z;
            scene.view.srp.z = scene.view.srp.z + n.z;

            console.log("W");
            clearScene();
            drawScene();
            break;
    }
}

///////////////////////////////////////////////////////////////////////////
// No need to edit functions beyond this point
///////////////////////////////////////////////////////////////////////////

// Called when user selects a new scene JSON file
function loadNewScene() {
    let scene_file = document.getElementById('scene_file');

    console.log(scene_file.files[0]);

    let reader = new FileReader();
    reader.onload = (event) => {
        scene = JSON.parse(event.target.result);
        scene.view.prp = Vector3(scene.view.prp[0], scene.view.prp[1], scene.view.prp[2]);
        scene.view.srp = Vector3(scene.view.srp[0], scene.view.srp[1], scene.view.srp[2]);
        scene.view.vup = Vector3(scene.view.vup[0], scene.view.vup[1], scene.view.vup[2]);

        for (let i = 0; i < scene.models.length; i++) {
            if (scene.models[i].type === 'generic') {
                for (let j = 0; j < scene.models[i].vertices.length; j++) {
                    scene.models[i].vertices[j] = Vector4(scene.models[i].vertices[j][0],
                                                          scene.models[i].vertices[j][1],
                                                          scene.models[i].vertices[j][2],
                                                          1);
                }
            }
            else {
                scene.models[i].center = Vector4(scene.models[i].center[0],
                                                 scene.models[i].center[1],
                                                 scene.models[i].center[2],
                                                 1);
            }
            scene.models[i].matrix = new Matrix(4, 4);
        }
    };
    reader.readAsText(scene_file.files[0], 'UTF-8');
}

// Draw black 2D line with red endpoints 
function drawLine(x1, y1, x2, y2) {
    ctx.strokeStyle = '#000000';
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();

    ctx.fillStyle = '#FF0000';
    ctx.fillRect(x1 - 2, y1 - 2, 4, 4);
    ctx.fillRect(x2 - 2, y2 - 2, 4, 4);
}


function clearScene()
{
    ctx.clearRect(0, 0, view.width, view.height);
}