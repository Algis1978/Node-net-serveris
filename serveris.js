import * as net from "net";
import * as path from "path";
import * as fs from "fs/promises";

const WEB = "web";
const PORT = 8080;
//event emitter - serveris

//socket - kanalas, kuriuo ateina duomenys iš naršyklės. Duomenys siunčiami paketais.
function readHeaders(socket) {
  return new Promise((resolve, reject) => {
    let res = ""; //res 
    socket.setEncoding("utf8");
    // socket.on seka duomenų paketų gavimą ir juos gavęs paduoda komandą į event loop'ą apie funkcijos iškvietimą.
    socket.on("data", (data) => {
      res += data; // res sudeda duomenis.
      const lines = data.split("\r\n"); //"\r\n" žymi kiekvienos eilutės pabaigą
      for (const line of lines) {
        if (line === "") { //res nustoja jungti, kai pasiekiama tuščia eilutė (šiuo atveju, sustoja po headerio);
          resolve(res);
          return;
        }
      }
    });
    //socket gauna pranešimą apie visus gautus duomenų paketus ir privalo būti uždarytas.
    socket.on("end", () => {
      resolve(res);
    });
    //gavus klaidą išsiunčia pranešimą.
    socket.on("error", (err) => {
      reject(err);
    });
  });
}

// async function handler(socket) {
//   let data;
//   try {
//     data = await readHeaders(socket); // skaito užklausos headerius
//     console.log("skaito header");
//     console.log(data);
//     const lines = data.split("\r\n"); // paima pirmą eilutę iš header
//     console.log("pirma header eilute");
//     console.log(lines);
//     let [, resource] = lines[0].split(" "); // paimamas tik resurso pavadinimas
//     console.log("resurso pavadinimas");
//     console.log(resource);
//     const f = path.join(WEB, resource); // ieškomas bylos pavadinimas (nurodytame WEB kataloge, apjungiamas kelas - wEB su resource).
//     console.log("surastas bylos pavadinimas");
//     console.log(f);
//     let res = ""; // bylos teksto duomenų skaitymo sudėjimui   
//     try {
//       // modulio fs.stat objektas pateikia statistiką apie bylą
//       const stat = await fs.stat(f);// gražina promisą, tad naudojama await funkciją       
//       if (stat.isFile()) {
//         const response = await fs.readFile(f, {
//           encoding: "utf8",
//         });
//         res += "HTTP/1.1 200 OK\r\n";
//         res += "\r\n";
//         res += response; 
//       } else if (stat.isDirectory()) {
//         const files = await fs.readdir(f); // fs.readdir pateikia bylų sąrašą kataloge
//         console.log(filess);
//         resource += (!resource.endsWith("/")) ? "/" : "";
//         res += "HTTP/1.1 200 OK\r\n"; // radus failą sugeneruojamas pranešimas.
//         res += "\r\n";
//         res += `<html>\r\n`;
//         res += `<body>\r\n`;
//         res += `Direktorija ${resource}<br>\r\n`;
//         if (resource != "/") {
//           res += `<a href="${resource + ".."}">..</a><br>\r\n`;
//         }
//         res += `<ul>\r\n`;
//         for (const fileName of files) {
//           res += `<li><a href="${resource + fileName}">${fileName}</a></li>`;// bylų sąrašas
//         }
//         res += "</ul></body></html>";
//       } else {
//         res += "HTTP/1.1 400 Bad Request\r\n";
//         res += "\r\n";
//       }
//     } catch (err) { // neradus bylos pateikiamas klaido pranešimas
//       res += "HTTP/1.1 404 Not Found\r\n";
//       res += "\r\n";
//     }
//     socket.write(res, "utf8"); // siunčiamas atsakymas į užklausą (res, koduotas utf8)

//   } catch (err) { // dar vienos klaidos ieškojimas prieš uždarant soketą.
//     console.log(data);
//     console.log("Klaida", err);
//     let res = "HTTP/1.1 400 Bad Request\r\n";
//     res += "\r\n";
//     socket.write(res, "utf8");
//   } finally {
//     socket.end(); // uždaromas soketas
//   }
// }

async function handler(socket) {
  let data;
  try {
    data = await readHeaders(socket);// skaito užklausos headerius
//    console.log("skaito header");
//    console.log(data);
    const lines = data.split("\r\n");// paima pirmą eilutę iš header
//     console.log("pirma header eilute");
//     console.log(lines);
    let [, resource] = lines[0].split(" ");// paimamas tik resurso pavadinimas
//     console.log("resurso pavadinimas");
//     console.log(resource);
    const f = path.join(WEB, resource);// ieškomas bylos pavadinimas (nurodytame WEB kataloge, apjungiamas kelas - wEB su resource).
//     console.log("surastas bylos pavadinimas");
//     console.log(f);

    let res = "";// bylos teksto duomenų skaitymo sudėjimui 
    try {
      const stat = await fs.stat(f);// modulio fs.stat objektas pateikia statistiką apie bylą
      if (stat.isFile()) { // ar yra byla
        const response = await fs.readFile(f, { // bylos skaitymas grąžina promisą, tad naudojama await funkciją       
          encoding: "utf8",
        });
        res += "HTTP/1.1 200 OK\r\n";
        res += "\r\n";
        res += response;
      } else if (stat.isDirectory()) { //jei yra katalogas
        const files = await fs.readdir(f); // fs.readdir pateikia bylų sąrašą kataloge
        resource += (!resource.endsWith("/")) ? "/" : ""; //jei nesibaigia resource.endswith, tai pridedamas "/".
        res += "HTTP/1.1 200 OK\r\n";
        res += "\r\n";
        res += `<html>\r\n`;
        res += `<body>\r\n`;
        res += `Direktorija ${resource}<br>\r\n`;
        if (resource != "/") { //prideda, kai resource nėra "/".
          //prideda mygtuką "atgal"
          res += `<a href="${resource + ".."}">..</a><br>\r\n`;
        }
        res += `<ul>\r\n`;
        for (const fileName of files) {
          res += `<li><a href="${resource + fileName}">${fileName}</a></li>`;
        }
        res += "</ul></body></html>";
      } else {
        res += "<h1>Klaida, katalogo nėra.";
        res += "HTTP/1.1 400 Bad Request\r\n";
        res += "\r\n";
      }
    } catch (err) {
      res += "HTTP/1.1 404 Not Found\r\n";
      res += "\r\n";
    }
    socket.write(res, "utf8");// siunčiamas atsakymas į užklausą (res, koduotas utf8)
  } catch (err) { // dar vienos klaidos ieškojimas prieš uždarant soketą.
    console.log(data);
    console.log("Klaida", err);
    let res = "HTTP/1.1 400 Bad Request\r\n";
    res += "\r\n";
    socket.write(res, "utf8");
  } finally {
    socket.end();// uždaromas soketas
  }
}

const srv = net.createServer(handler);

srv.listen(PORT);
console.log("Server started");