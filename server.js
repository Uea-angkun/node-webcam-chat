//Node.js server-side ที่ใช้ Express , Socket ในการสร้างเว็บวิดิโอ เป็นการนำเข้า Express ,uuid ไลบรารี่ และสร้าง Express ,http
const express = require("express");
const app = express();
const server = require("http").Server(app);
const { v4: uuidv4 } = require("uuid");

//เป็นการนำ module ExpressPeerServer เข้าจาก peer และสร้างออบเจกต์ตัวเลือกที่มีคุณสมบัติการดีบัก
const { ExpressPeerServer } = require("peer");
const opinions = {
    debug: true,
}

//ตั้งค่าเอนจิ้นสำหรับแอปพลิเคชัน Express เป็น EJS จากนั้นนำ Socket แนบไปกับ HTTP server 
//ตั้งค่า cors ใช้เพื่ออนุญาตการเชื่อมต่อจาก origin ไดก็ได้
app.set("view engine", "ejs");
const io = require("socket.io")(server, {
    cors: {
        origin: '*'
    }
});


//ติดตั้ง มิดเดิลแวร์ ExpressPeerServer บน /peerjs และให้บริการเนื้อหาเป็นสาธารณะ
app.use("/peerjs", ExpressPeerServer(server, opinions));
app.use(express.static("public"));

//สร้างเส้นทางสำหรับ url root และเปลื่ยนเส้นทางไปยังไอดีห้องที่สุ่ม
app.get("/", (req, res) => {
    res.redirect(`/${uuidv4()}`);
});

//สร้างเส้นทางสำหรับ url ที่กำหนด และสร้างห้องตาม roomID 
app.get("/:room", (req, res) => {
    res.render("room", { roomId: req.params.room });
});

// รอข้อมูลจากผู้ใช้ เมื่อผู้ใช้เชื่อมต่อก็จะรอการเข้าห้อง 
// จากนั้นจะเข้าห้องด้วยรหัสห้องตาม roomID จากนั้นก็สั่งใช้งาน user-connected ตาม userId 
//หลังจากนั้นรอรับข้อความ เมื่อได้รับข้อมความจะส่งข้อมความและชื่อผู้ใช้ไปยังห้อง
io.on("connection", (socket) => {
    socket.on("join-room", (roomId, userId, userName) => {
        socket.join(roomId);
        setTimeout(() => {
            socket.to(roomId).broadcast.emit("user-connected", userId);
        }, 1000)
        socket.on("message", (message) => {
            io.to(roomId).emit("createMessage", message, userName);
        });
    });
});

// server รอรับข้อมูลตามพอร์ตที่ระบุ
server.listen(process.env.PORT || 3030);

