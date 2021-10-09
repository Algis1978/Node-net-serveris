import * as net from "net";
import * as path from "path";
import * as fs from "fs/promises";

const WEB = "web";
const PORT = 8080;

function readHeaders(socket) {
  return new Promise((resolve, reject) => {
    let res = "";
    socket.setEncoding("utf8");
    socket.on("data", (data) => {
      res += data;
      const lines = data.split("\r\n");
      for (const line of lines) {
        if (line === "") {
          resolve(res);
          return;
        }
      }
    });
    socket.on("end", () => {
      resolve(res);
    });
    socket.on("error", (err) => {
      reject(err);
    });
  });
}

async function handler(socket) {
  let data;
  try {
    data = await readHeaders(socket); // skaito užklausos headerius
    console.log(data);
    const lines = data.split("\r\n"); // paima pirmą eilutę iš header
    let [, resource] = lines[0].split(" "); // paimamas tik resurso pavadinimas
    const f = path.join(WEB, resource); // ieškomas bylos pavadinimas (WEB kataloge, apjungimas kelių wEB su resource).

    let res = ""; // bylos skaitymas
    try {
      const stat = await fs.stat(f);
      if (stat.isFile()) {
        const response = await fs.readFile(f, {
          encoding: "utf8",
        });
        res += "HTTP/1.1 200 OK\r\n";
        res += "\r\n";
        res += response;
      } else if (stat.isDirectory()) {
        const files = await fs.readdir(f);
        resource += (!resource.endsWith("/")) ? "/" : "";
        res += "HTTP/1.1 200 OK\r\n"; // radus failą sugeneruojamas pranešimas.
        res += "\r\n";
        res += `<html>\r\n`;
        res += `<body>\r\n`;
        res += `Direktorija ${resource}<br>\r\n`;
        if (resource != "/") {
          res += `<a href="${resource + ".."}">..</a><br>\r\n`;
        }
        res += `<ul>\r\n`;
        for (const fileName of files) {
          res += `<li><a href="${resource + fileName}">${fileName}</a></li>`;
        }
        res += "</ul></body></html>";
      } else {
        res += "HTTP/1.1 400 Bad Request\r\n";
        res += "\r\n";
      }
    } catch (err) { // neradus bylos pateikiamas klaido pranešimas
      res += "HTTP/1.1 404 Not Found\r\n";
      res += "\r\n";
    }
    socket.write(res, "utf8"); // siunčiamas atsakymas į užklausą (res, koduotas utf8)

  } catch (err) { // dar vienos klaidos ieškojimas prieš uždarant soketą.
    console.log(data);
    console.log("Klaida", err);
    let res = "HTTP/1.1 400 Bad Request\r\n";
    res += "\r\n";
    socket.write(res, "utf8");
  } finally {
    socket.end(); // uždariomas soketas
  }
}

const srv = net.createServer(handler);

srv.listen(PORT);
console.log("Server started");