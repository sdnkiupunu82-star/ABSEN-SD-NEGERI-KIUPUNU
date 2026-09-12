const express=require("express");
const path=require("path");
const fs=require("fs");
const bcrypt=require("bcryptjs");
const jwt=require("jsonwebtoken");
const ExcelJS=require("exceljs");

const app=express();
const PORT=process.env.PORT||3000;
const JWT_SECRET=process.env.JWT_SECRET||"kiupunu-change-this-secret";
const DATA=path.join(__dirname,"data","database.json");
app.use(express.json({limit:"3mb"}));
app.use(express.static(path.join(__dirname,"public")));

const school={
 name:"ABSENSI SD NEGERI KIUPUNU",
 address:"Jl. Pelajar",
 district:"Bikomo Selatan",
 regency:"Timor Tengah Utara",
 province:"Nusa Tenggara Timur",
 creator:"Odi Funan"
};

function emptyDB(){return {users:[],teachers:[],students:[],attendance:[],settings:{school}}}
function load(){if(!fs.existsSync(DATA))return emptyDB();return JSON.parse(fs.readFileSync(DATA,"utf8"))}
function save(db){fs.mkdirSync(path.dirname(DATA),{recursive:true});fs.writeFileSync(DATA,JSON.stringify(db,null,2))}
function isoToday(){return new Date().toLocaleDateString("en-CA",{timeZone:"Asia/Makassar"})}
function nowTime(){return new Date().toLocaleTimeString("id-ID",{timeZone:"Asia/Makassar",hour:"2-digit",minute:"2-digit",second:"2-digit"})}
function seed(){
 const db=load();
 if(db.users.length)return;
 const pass=p=>bcrypt.hashSync(p,10);
 db.users=[
  {id:"u-admin",username:"admin",passwordHash:pass("admin123"),role:"admin",name:"Administrator"},
  {id:"u-piket",username:"piket",passwordHash:pass("piket123"),role:"piket",name:"Guru Piket"},
  {id:"u-guru",username:"guru",passwordHash:pass("guru123"),role:"guru",name:"Guru Kelas"}
 ];
 db.teachers=[
  {id:"g1",name:"Siti Aminah, S.Pd",nip:"198501012010012001",email:"",phone:"",faceDescriptor:null},
  {id:"g2",name:"Budi Santoso, S.Pd",nip:"198603032011011002",email:"",phone:"",faceDescriptor:null},
  {id:"g3",name:"Rina Lestari, S.Pd",nip:"198706122012022003",email:"",phone:"",faceDescriptor:null}
 ];
 db.students=[
  {id:"s1",name:"Andi Pratama",nis:"1001",className:"IV A",gender:"L",faceDescriptor:null},
  {id:"s2",name:"Bunga Lestari",nis:"1002",className:"IV A",gender:"P",faceDescriptor:null},
  {id:"s3",name:"Citra Dewi",nis:"1003",className:"IV A",gender:"P",faceDescriptor:null},
  {id:"s4",name:"Dika Saputra",nis:"1004",className:"IV A",gender:"L",faceDescriptor:null},
  {id:"s5",name:"Elsa Putri",nis:"1005",className:"IV A",gender:"P",faceDescriptor:null},
  {id:"s6",name:"Fajar Maulana",nis:"1006",className:"V A",gender:"L",faceDescriptor:null}
 ];
 save(db);
}
seed();

function auth(req,res,next){
 const h=req.headers.authorization||"";
 try{
  if(!h.startsWith("Bearer "))throw Error();
  req.user=jwt.verify(h.slice(7),JWT_SECRET);next();
 }catch{res.status(401).json({error:"Sesi tidak valid atau sudah berakhir"})}
}
function allow(...roles){return (req,res,next)=>roles.includes(req.user.role)?next():res.status(403).json({error:"Akses ditolak"})}
function person(type,id){
 const db=load();return (type==="teacher"?db.teachers:db.students).find(x=>x.id===id);
}
function distance(a,b){
 if(!Array.isArray(a)||!Array.isArray(b)||a.length!==b.length)return 999;
 let s=0;for(let i=0;i<a.length;i++){let d=a[i]-b[i];s+=d*d}
 return Math.sqrt(s/a.length);
}

app.get("/api/info",(req,res)=>res.json(school));

app.post("/api/login",async(req,res)=>{
 const {username,password}=req.body||{},db=load();
 const u=db.users.find(x=>x.username===username);
 if(!u||!(await bcrypt.compare(password||"",u.passwordHash)))return res.status(401).json({error:"Username atau password salah"});
 const token=jwt.sign({id:u.id,username:u.username,name:u.name,role:u.role},JWT_SECRET,{expiresIn:"12h"});
 res.json({token,user:{id:u.id,username:u.username,name:u.name,role:u.role}});
});

app.get("/api/me",auth,(req,res)=>res.json(req.user));

app.get("/api/dashboard",auth,async(req,res)=>{
 const db=load(),d=isoToday(),a=db.attendance.filter(x=>x.date===d);
 const teachers=db.teachers,students=db.students;
 const ta=a.filter(x=>x.personType==="teacher"),sa=a.filter(x=>x.personType==="student");
 const week=[];for(let i=6;i>=0;i--){const dt=new Date();dt.setDate(dt.getDate()-i);const ds=dt.toLocaleDateString("en-CA",{timeZone:"Asia/Makassar"});const all=db.attendance.filter(x=>x.date===ds);week.push({date:ds,teachers:all.filter(x=>x.personType==="teacher"&&(x.status==="Hadir"||x.status==="Terlambat")).length,students:all.filter(x=>x.personType==="student"&&(x.status==="Hadir"||x.status==="Terlambat")).length})}
 res.json({
  date:d,totalTeachers:teachers.length,totalStudents:students.length,
  teacherPresent:ta.filter(x=>["Hadir","Terlambat"].includes(x.status)).length,
  studentPresent:sa.filter(x=>["Hadir","Terlambat"].includes(x.status)).length,
  teacherLate:ta.filter(x=>x.status==="Terlambat").length,studentLate:sa.filter(x=>x.status==="Terlambat").length,
  teacherMissing:Math.max(0,teachers.length-ta.length),studentMissing:Math.max(0,students.length-sa.length),week
 });
});

app.get("/api/people/:type",auth,(req,res)=>{
 const db=load();let arr=req.params.type==="teachers"?db.teachers:req.params.type==="students"?db.students:null;
 if(!arr)return res.status(404).json({error:"Tipe tidak valid"});
 res.json(arr.map(x=>({...x,faceDescriptor:!!x.faceDescriptor})));
});

app.post("/api/people/:type",auth,allow("admin"),(req,res)=>{
 const db=load(),t=req.params.type;
 if(t==="teachers"){
  const p={id:"g"+Date.now(),name:req.body.name,nip:req.body.nip||"",email:req.body.email||"",phone:req.body.phone||"",faceDescriptor:null};
  db.teachers.push(p);save(db);return res.json(p);
 }
 if(t==="students"){
  const p={id:"s"+Date.now(),name:req.body.name,nis:req.body.nis||"",className:req.body.className||"I A",gender:req.body.gender||"",faceDescriptor:null};
  db.students.push(p);save(db);return res.json(p);
 }
 res.status(400).json({error:"Tipe tidak valid"});
});

app.put("/api/people/:type/:id",auth,allow("admin"),(req,res)=>{
 const db=load(),arr=req.params.type==="teachers"?db.teachers:db.students,p=arr.find(x=>x.id===req.params.id);
 if(!p)return res.status(404).json({error:"Data tidak ditemukan"});
 Object.assign(p,req.body);delete p.id;delete p.faceDescriptor;save(db);res.json(p);
});
app.delete("/api/people/:type/:id",auth,allow("admin"),(req,res)=>{
 const db=load(),key=req.params.type==="teachers"?"teachers":"students";
 db[key]=db[key].filter(x=>x.id!==req.params.id);db.attendance=db.attendance.filter(x=>x.personId!==req.params.id);save(db);res.json({ok:true});
});

app.post("/api/face/enroll",auth,allow("admin"),(req,res)=>{
 const {type,id,descriptor}=req.body||{},p=person(type,id);
 if(!p)return res.status(404).json({error:"Data tidak ditemukan"});
 if(!Array.isArray(descriptor)||descriptor.length!==128)return res.status(400).json({error:"Descriptor wajah tidak valid"});
 p.faceDescriptor=descriptor;const db=load();save(db);res.json({ok:true});
});

app.post("/api/face/verify",auth,allow("piket","guru","admin"),(req,res)=>{
 const {type,descriptor}=req.body||{},db=load();
 if(!Array.isArray(descriptor)||descriptor.length!==128)return res.status(400).json({error:"Descriptor tidak valid"});
 const arr=type==="teacher"?db.teachers:db.students;
 const threshold=Number(process.env.FACE_THRESHOLD||0.52);
 let best=null,bestDistance=999;
 for(const p of arr){if(!p.faceDescriptor)continue;const d=distance(descriptor,p.faceDescriptor);if(d<bestDistance){best=p;bestDistance=d}}
 if(!best||bestDistance>threshold)return res.status(404).json({matched:false,error:"Wajah belum dikenali. Pastikan wajah sudah didaftarkan Admin."});
 const date=isoToday(),existing=db.attendance.find(x=>x.personId===best.id&&x.date===date);
 if(existing)return res.json({matched:true,already:true,distance:bestDistance,person:{id:best.id,name:best.name,className:best.className||""},record:existing});
 const hour=new Date().getHours();
 const late=hour>=8;
 const record={id:"a"+Date.now(),personId:best.id,personType:type,name:best.name,className:best.className||"",date,time:nowTime(),status:late?"Terlambat":"Hadir",method:"Kamera + Verifikasi Wajah",note:""};
 db.attendance.push(record);save(db);
 res.json({matched:true,already:false,distance:bestDistance,person:{id:best.id,name:best.name,className:best.className||""},record});
});

app.get("/api/attendance",auth,(req,res)=>{
 const db=load();let a=db.attendance.slice();
 const {from,to,type,className,status}=req.query;
 if(from)a=a.filter(x=>x.date>=from);if(to)a=a.filter(x=>x.date<=to);if(type)a=a.filter(x=>x.personType===type);
 if(className)a=a.filter(x=>x.className===className);if(status)a=a.filter(x=>x.status===status);
 if(req.user.role==="guru")a=a.filter(x=>x.personType==="student");
 a.sort((x,y)=>(y.date+y.time).localeCompare(x.date+x.time));res.json(a);
});

app.post("/api/attendance/manual",auth,allow("admin","guru","piket"),(req,res)=>{
 const {personId,personType,status,note,date}=req.body||{},db=load(),p=person(personType,personId);
 if(!p)return res.status(404).json({error:"Data tidak ditemukan"});
 const d=date||isoToday();
 const old=db.attendance.find(x=>x.personId===personId&&x.date===d);
 if(old){old.status=status||old.status;old.note=note||"";save(db);return res.json(old)}
 const r={id:"a"+Date.now(),personId,personType,name:p.name,className:p.className||"",date:d,time:nowTime(),status:status||"Hadir",method:"Manual",note:note||""};
 db.attendance.push(r);save(db);res.json(r);
});
app.put("/api/attendance/:id",auth,allow("admin"),(req,res)=>{
 const db=load(),a=db.attendance.find(x=>x.id===req.params.id);if(!a)return res.status(404).json({error:"Tidak ditemukan"});
 Object.assign(a,{status:req.body.status||a.status,note:req.body.note??a.note,date:req.body.date||a.date,time:req.body.time||a.time});save(db);res.json(a);
});
app.delete("/api/attendance/:id",auth,allow("admin"),(req,res)=>{
 const db=load();db.attendance=db.attendance.filter(x=>x.id!==req.params.id);save(db);res.json({ok:true});
});

app.get("/api/summary",auth,(req,res)=>{
 const db=load(),from=req.query.from,to=req.query.to,type=req.query.type,className=req.query.className;
 let people=type==="teacher"?db.teachers:type==="student"?db.students:[...db.teachers,...db.students];
 if(className)people=people.filter(x=>x.className===className);
 const a=db.attendance.filter(x=>(!from||x.date>=from)&&(!to||x.date<=to)&&(!type||x.personType===type)&&(!className||x.className===className));
 res.json(people.map(p=>{
  const personType=db.teachers.some(x=>x.id===p.id)?"teacher":"student",rows=a.filter(x=>x.personId===p.id);
  return {id:p.id,name:p.name,className:p.className||"-",hadir:rows.filter(x=>x.status==="Hadir").length,terlambat:rows.filter(x=>x.status==="Terlambat").length,izin:rows.filter(x=>x.status==="Izin").length,sakit:rows.filter(x=>x.status==="Sakit").length,alpa:rows.filter(x=>x.status==="Alpa").length,total:rows.length,personType};
 }));
});

app.get("/api/export",auth,async(req,res)=>{
 const db=load();let a=db.attendance.slice(),{from,to,type,className}=req.query;
 if(from)a=a.filter(x=>x.date>=from);if(to)a=a.filter(x=>x.date<=to);if(type)a=a.filter(x=>x.personType===type);if(className)a=a.filter(x=>x.className===className);
 const wb=new ExcelJS.Workbook();wb.creator=school.creator;
 const ws=wb.addWorksheet("Rekap Absensi");ws.mergeCells("A1:I1");ws.getCell("A1").value=school.name;ws.getCell("A1").font={bold:true,size:16};ws.getCell("A1").alignment={horizontal:"center"};
 ws.mergeCells("A2:I2");ws.getCell("A2").value=`${school.address}, ${school.district}, ${school.regency}, ${school.province}`;ws.getCell("A2").alignment={horizontal:"center"};
 ws.addRow([]);ws.addRow(["No","Tanggal","Waktu","Nama","Kelas","Jenis","Status","Metode","Keterangan"]);
 const head=ws.getRow(4);head.font={bold:true};head.alignment={horizontal:"center"};
 a.sort((x,y)=>(x.date+x.time).localeCompare(y.date+y.time));
 a.forEach((x,i)=>ws.addRow([i+1,x.date,x.time,x.name,x.className||"-",x.personType==="teacher"?"Guru":"Siswa",x.status,x.method,x.note||""]));
 [6,12,12,30,12,12,14,28,28].forEach((w,i)=>ws.getColumn(i+1).width=w);
 ws.eachRow((row,n)=>{if(n>=4)row.eachCell(c=>{c.border={bottom:{style:"thin",color:{argb:"FFDDE5F0"}}};c.alignment={vertical:"middle"}})});
 ws.autoFilter={from:"A4",to:"I4"};ws.views=[{state:"frozen",ySplit:4}];
 res.setHeader("Content-Type","application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
 res.setHeader("Content-Disposition",'attachment; filename="Rekap_Absensi_SD_Negeri_Kiupunu.xlsx"');
 await wb.xlsx.write(res);res.end();
});

app.get("*",(req,res)=>res.sendFile(path.join(__dirname,"public","index.html")));
app.listen(PORT,()=>console.log(`ABSENSI SD NEGERI KIUPUNU V2 running on ${PORT}`));
