const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const P=require('pino'); const qrcode=require('qrcode-terminal'); const fs=require('fs'); const path=require('path');
const AUTH=path.join(__dirname,'auth_info_baileys'), DB=path.join(__dirname,'data','pengaduan.json');
fs.mkdirSync(path.dirname(DB),{recursive:true}); if(!fs.existsSync(DB)) fs.writeFileSync(DB,'[]');
const sessions=new Map();
const opening=`*🇮🇩 SELAMAT DATANG DI PORTAL PENGADUAN DAN ASPIRASI MASYARAKAT
YONIF TP 953/HARIMAU RAWA 🇮🇩*

Portal ini merupakan sarana komunikasi masyarakat untuk menyampaikan laporan, pengaduan, informasi, serta aspirasi. Kami akan menerima dan menindaklanjutinya sesuai ketentuan yang berlaku

*Apakah ada yang bisa kami bantu?*

Silakan pilih layanan yang Anda perlukan: *MENU*`;
const menu=`🇮🇩 *PORTAL PELAYANAN MASYARAKAT*\n*YONIF TP 953/HARIMAU RAWA*\n\n━━━━━━━━━━━━━━━━━━━━━━\n*01 | PENGADUAN*\n*02 | SINERGI & ASPIRASI*\n*03 | INFORMASI*\n*04 | CEK STATUS*\n*05 | HUBUNGI PETUGAS*\n*06 | TENTANG PORTAL*\n*07 | KEADAAN DARURAT*\n*08 | PENGAWASAN ANGGOTA*\n━━━━━━━━━━━━━━━━━━━━━━\nKetik *01–08* untuk memilih layanan.\nKetik *BATAL* untuk membatalkan.`;
const flows={
'01':['PENGADUAN',['Nama pelapor','Jenis pengaduan','Waktu dan lokasi kejadian','Uraian pengaduan','Bukti pendukung (ketik TIDAK ADA jika tidak ada)','Nomor yang dapat dihubungi']],
'02':['SINERGI & ASPIRASI',['Nama Anda','Saran/aspirasi/gagasan atau bentuk sinergi','Bukti/dokumen pendukung (ketik TIDAK ADA jika tidak ada)','Nomor yang dapat dihubungi']],
'05':['HUBUNGI PETUGAS',['Nama Anda','Keperluan','Pesan atau pertanyaan','Nomor yang dapat dihubungi']],
'07':['KEADAAN DARURAT',['Jenis keadaan darurat','Lokasi kejadian','Waktu kejadian','Kondisi/situasi saat ini','Nomor yang dapat dihubungi']],
'08':['PENGAWASAN ANGGOTA',['Nama pelapor','Waktu dan lokasi kejadian','Nama atau identitas anggota, apabila diketahui','Uraian kejadian','Bukti pendukung (ketik TIDAK ADA jika tidak ada)','Nomor yang dapat dihubungi']]
};
const norm=x=>String(x||'').trim().toUpperCase();
function db(){return JSON.parse(fs.readFileSync(DB,'utf8'))} function save(x){fs.writeFileSync(DB,JSON.stringify(x,null,2))}
function ticket(){let d=db(), n=d.map(x=>+(x.ticket||'').split('-').pop()).filter(Number.isFinite);return `PGA-${new Date().getFullYear()}-${String((n.length?Math.max(...n):0)+1).padStart(4,'0')}`}
async function start(){
 const {state,saveCreds}=await useMultiFileAuthState(AUTH); const sock=makeWASocket({auth:state,logger:P({level:'silent'}),printQRInTerminal:false}); sock.ev.on('creds.update',saveCreds);
 sock.ev.on('connection.update',u=>{if(u.qr){console.log('\nSCAN QR WHATSAPP:\n');qrcode.generate(u.qr,{small:true});console.log('\nWhatsApp > Perangkat tertaut > Tautkan perangkat.');} if(u.connection==='open')console.log('✅ BOT WHATSAPP TERHUBUNG.'); if(u.connection==='close'&&u.lastDisconnect?.error?.output?.statusCode!==DisconnectReason.loggedOut)setTimeout(start,3000)});
 sock.ev.on('messages.upsert',async({messages})=>{let m=messages[0];if(!m?.message||m.key.fromMe)return;let j=m.key.remoteJid;if(!j||j.endsWith('@g.us'))return;let t=(m.message.conversation||m.message.extendedTextMessage?.text||'').trim(),c=norm(t),s=sessions.get(j);
 if(!s&&c!=='MENU'){await sock.sendMessage(j,{text:opening});return} if(c==='MENU'){sessions.delete(j);await sock.sendMessage(j,{text:menu});return} if(c==='BATAL'||c==='0'){sessions.delete(j);await sock.sendMessage(j,{text:'✅ Proses dibatalkan.\\n\\nKetik *MENU* untuk kembali.'});return}
 if(!s&&flows[c]){let [type,fields]=flows[c];sessions.set(j,{type,fields,i:0,data:{}});let msg=`${type==='KEADAAN DARURAT'?'🚨':'🇮🇩'} *LAYANAN ${type}*\\n\\n`;if(type==='KEADAAN DARURAT')msg+='⚠️ WhatsApp ini *bukan pengganti layanan darurat resmi*. Jika keselamatan terancam, hubungi layanan darurat/instansi terkait secara langsung.\\n\\n';msg+=`*${fields[0]}:*`;await sock.sendMessage(j,{text:msg});return}
 if(!s&&c==='03'){await sock.sendMessage(j,{text:'ℹ️ *INFORMASI*\\n\\n01 Tata Cara Pengaduan\\n02 Sinergi & Aspirasi\\n03 Cek Status\\n04 Hubungi Petugas\\n05 Ketentuan Layanan\\n\\nKetik *MENU* untuk kembali.'});return}
 if(!s&&c==='04'){sessions.set(j,{check:true});await sock.sendMessage(j,{text:'🔎 *CEK STATUS*\\n\\nMasukkan nomor tiket, contoh *PGA-2026-0001*.'});return}
 if(!s&&c==='06'){await sock.sendMessage(j,{text:'🇮🇩 *TENTANG PORTAL*\\n\\nPortal ini merupakan sarana komunikasi masyarakat untuk menyampaikan laporan, pengaduan, informasi, sinergi, dan aspirasi sesuai ketentuan yang berlaku.\\n\\nKetik *MENU* untuk kembali.'});return}
 if(s?.check){let r=db().find(x=>norm(x.ticket)===c);await sock.sendMessage(j,{text:r?`🔎 *STATUS*\\n\\n🎫 ${r.ticket}\\n📌 ${r.type}\\n📍 *${r.status}*`:'❌ Nomor tiket tidak ditemukan.'});sessions.delete(j);return}
 if(s){let key=s.fields[s.i];s.data[`field${s.i+1}`]=t;s.i++;if(s.i<s.fields.length){await sock.sendMessage(j,{text:`✦ *${s.fields[s.i]}:*`});return} s.confirm=true;await sock.sendMessage(j,{text:'📋 *KONFIRMASI DATA*\\n\\n'+Object.values(s.data).map((v,i)=>`• ${s.fields[i]}: ${v}`).join('\\n')+'\\n\\nKetik *1* untuk KIRIM atau *2* untuk BATAL.\\n'});return}
 if(s?.confirm){if(c==='1'){let d=db(),tk=ticket();d.push({ticket:tk,type:s.type,status:'DITERIMA',createdAt:new Date().toISOString(),sender:j,data:s.data});save(d);sessions.delete(j);await sock.sendMessage(j,{text:`✅ *LAPORAN BERHASIL DITERIMA*\\n\\n🎫 Nomor Tiket: *${tk}*\\n📌 Status: *DITERIMA*\\n\\nGunakan *04 — CEK STATUS* untuk memeriksa perkembangan.`});return}}
 });
}
start();