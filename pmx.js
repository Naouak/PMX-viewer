// Definitions for PMX FILES HERE
function FileReader(buffer){
    var position = 0;
    var data = new DataView(buffer);

    this.getPosition = function(){ return position; };

    this.readByte = function(size){
        size = size || 1;
        var ret = [];
        while(size > 0){
            ret.push(data.getInt8(position));
            position+=1;
            size-=1;
        }
        return ret;
    };

    this.readUbyte = function(size){
        size = size || 1;
        var ret = [];
        while(size > 0){
            ret.push(data.getUint8(position));
            position+=1;
            size-=1;
        }
        return ret;
    };

    this.readShort = function(){
        var ret = data.getInt16(position, true);
        position+=2;
        return ret;
    };

    this.readUshort = function(){
        var ret = data.getUint16(position, true);
        position+=2;
        return ret;
    };

    this.readInt = function(){
        var ret = data.getInt32(position, true);
        position+=4;
        return ret;
    };

    this.readUint = function(){
        var ret = data.getUint32(position, true);
        position+=4;
        return ret;
    };

    this.readFloat = function(){
        var ret = data.getFloat32(position, true);
        position+=4;
        return ret;
    };
}

function Vec2(){
    this.x = null;
    this.y = null;
    this.readFromFile = function(file){
        this.x = file.readFloat();
        this.y = file.readFloat();
    }
}

function Vec3(){
    this.x = null;
    this.y = null;
    this.z = null;
    this.readFromFile = function(file){
        this.x = file.readFloat();
        this.y = file.readFloat();
        this.z = file.readFloat();
    };
    this.getData = function(){
        return [this.x, this.y, this.z];
    }
}

function Vec4(){
    this.x = null;
    this.y = null;
    this.z = null;
    this.w = null;
    this.readFromFile = function(file){
        this.x = file.readFloat();
        this.y = file.readFloat();
        this.z = file.readFloat();
        this.w = file.readFloat();
    }
}

function Text(){
    this.length = null;
    this.text = null;
    this.readFromFile = function(file){
        this.length = file.readByte(4);
        this.length = (this.length[1]<<8)+this.length[0];
        this.text = file.readUbyte(this.length);
    }

    this.toString = function(){
        var str = "";
        for(var i = 0; i < this.text.length; i+=2){
            if(this.text[i+1] == 0){
                str+=String.fromCharCode(this.text[i]);
            } else {
                str+=String.fromCharCode(this.text[i]<<8+this.text[i+1]);
            }
        }
        return str;
    }
}

function Flag(){
    this.flag = null;
    this.readFromFile = function(file){
        this.flag = file.readByte(1)[0];
    }
}

function readBoneIndex(buffer, boneIndexSize){
    switch(boneIndexSize){
        case 1:
            return buffer.readByte(1)[0];
        case 2:
            return buffer.readShort();
        case 4:
            return buffer.readInt();
    }
}

function BDEF1(buffer, boneIndexSize){
    this.index = readBoneIndex(buffer, boneIndexSize);
}

function BDEF2(buffer, boneIndexSize){
    this.index1 = readBoneIndex(buffer, boneIndexSize);
    this.index2 = readBoneIndex(buffer, boneIndexSize);
    this.weight1 = buffer.readFloat();
    this.weight2 = 1.0 - this.weight1;
}

function BDEF4(buffer, boneIndexSize){
    this.index1 = readBoneIndex(buffer, boneIndexSize);
    this.index2 = readBoneIndex(buffer, boneIndexSize);
    this.index3 = readBoneIndex(buffer, boneIndexSize);
    this.index4 = readBoneIndex(buffer, boneIndexSize);
    this.weight1 = buffer.readFloat();
    this.weight2 = buffer.readFloat();
    this.weight3 = buffer.readFloat();
    this.weight4 = buffer.readFloat();
}

function SDEF(buffer, boneIndexSize){
    this.bdef = new BDEF2(buffer, boneIndexSize);
    this.C = new Vec3();
    this.C.readFromFile(buffer);
    this.R0 = new Vec3();
    this.R0.readFromFile(buffer);
    this.R1 = new Vec3();
    this.R1.readFromFile(buffer);
}

function PMXHeader(buffer){
    this.signature = buffer.readByte(4);
    this.version = buffer.readFloat();
    this.globalsCount = buffer.readByte(1)[0];
    console.log(this.globalsCount);
    this.globals = buffer.readByte(this.globalsCount);
    this.nameLocal = new Text();
    this.nameLocal.readFromFile(buffer);
    this.nameUniversal = new Text();
    this.nameUniversal.readFromFile(buffer);
    this.commentsLocal = new Text();
    this.commentsLocal.readFromFile(buffer);
    this.commentsUniversal = new Text();
    this.commentsUniversal.readFromFile(buffer);
}

function PMXVertex(buffer, addVec4, boneIndex){
    this.position = new Vec3();
    this.position.readFromFile(buffer);
    this.normal = new Vec3();
    this.normal.readFromFile(buffer);
    this.uv = new Vec2();
    this.uv.readFromFile(buffer);
    this.addVec4 = [];
    for(var i = 0; i < addVec4; i++){
        var vec4 = new Vec4();
        vec4.readFromFile(buffer);
        this.addVec4.push(vec4);
    }
    this.weightDeformType = buffer.readByte(1)[0];

    switch (this.weightDeformType){
        case 0:
            //BDEF1
            this.weightDeform = new BDEF1(buffer, boneIndex);
            break;
        case 1:
            //BDEF2
            this.weightDeform = new BDEF2(buffer, boneIndex);
            break;
        case 2:
            //BDEF4
            this.weightDeform = new BDEF4(buffer, boneIndex);
            break;
        case 3:
            //SDEF
            this.weightDeform = new SDEF(buffer, boneIndex);
            break;
        case 4:
            //QDEF
            this.weightDeform = new BDEF4(buffer, boneIndex);
            break;
    }

    this.edgeScale = buffer.readFloat();
}

function PMXFile(buffer){
    this.header = new PMXHeader(buffer);
//        switch(this.header.globals[2]){
//            case 1:
//                this.vertexCount = buffer.readUbyte(1)[0];
//                break;
//            case 2:
//                    this.vertexCount = buffer.readUshort();
//                break;
//            case 4:
//                    this.vertexCount = buffer.readUint();
//                break;
//            default:
//                throw "Vertex globals error";
//        }
    this.vertexCount = buffer.readUint();
    this.vertices = [];
    this.vertexData = new Float32Array(this.vertexCount*3);
    for(var i = 0; i < this.vertexCount; i++){
        var vertex = new PMXVertex(buffer,this.header.globals[1], this.header.globals[5]);
        this.vertices.push(vertex);
        var vertexData = vertex.position.getData();
        this.vertexData[3*i] = vertexData[0];
        this.vertexData[3*i+1] = vertexData[1];
        this.vertexData[3*i+2] = vertexData[2];
    }

    this.surfaceCount = buffer.readUint();
    this.surfaces = this.header.globals[2]==1?new Uint8Array(this.surfaceCount):this.header.globals[2]==2?new Uint16Array(this.surfaceCount):new Uint32Array(this.surfaceCount);
    for(i = 0; i < this.surfaceCount; i++){
        this.surfaces[i] = (this.header.globals[2]==1?buffer.readUbyte(1)[0]:this.header.globals[2]==2?buffer.readUshort():buffer.readInt());
    }

    this.textureCount = buffer.readInt();
    this.textures = [];
    for(i = 0; i < this.textureCount; i++){
        var path = new Text();
        path.readFromFile(buffer);
        this.textures.push(path);
    }

}