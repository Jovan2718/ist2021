const express = require("express")
const fs = require("fs")
const app = express()
const path = require('path')
const axios = require('axios')
const { sviProizvodi } = require("../ProdavnicaServis/node_modules/prodavnica-modul/rad-sa-proizvodima")
const port = 5000;

app.use(express.urlencoded({ extended: false }))
app.use(express.json())

//Funkcija za citanje imena stranice
let procitajStranicuZaNaziv = (naziv) => {
    return fs.readFileSync(path.join(__dirname + "/stranice/" + naziv + ".html"), "utf-8")
}

//Pocetna stranica
app.get("/", (req, res) => {
    res.send(procitajStranicuZaNaziv("index"))
});

//Prikaz svih proizvoda
app.get("/sviproizvodi", (req, res) => {
    axios.get('http://localhost:3000/sviproizvodi')
        .then(response => {
            let prikaz = ""
            response.data.forEach(element => {
                prikaz += `<div class="kartica">
            <div class="ime">${element.tekstProizvoda}</div>
            <div class = "cena">${element.cena}rsd.</div>
            <div class = "detaljnije"><a href="/detaljnije/${element.id}">Detaljnije</a></div>
            <div class = "dugme">
            <a href="/obrisi/${element.id}" class = "dugme1" id = "obrisi">Obrisi</a>
            <a href="/promenavrednosti/${element.id}"  class = "dugme1" id = "update">Update</a>
            </div>
        </div>`
            })

            res.send(procitajStranicuZaNaziv("sviproizvodi").replace("#{data}", prikaz))
        })
        .catch(error => {
            console.log(error)
        })
})

//Detaljniji prikaz za odredjeni proizvod(prikaz kategorije)
app.get("/detaljnije/:id", (req, res) => {
    axios.get(`http://localhost:3000/getproizvodbyid/${req.params["id"]}`)
        .then(response => {
            let prikaz = ""
            prikaz += `<div class = "kartica">
            <div>${response.data.id}</div>
            <div>${response.data.tekstProizvoda}</div>
            <div>${response.data.cena}rsd.</div>
            <div>${response.data.kategorijaProizvoda}</div>
            ${prikaziOznake(response.data)}
            <div class = "dugme">
                <a href="/obrisi/${response.data.id}" class = "dugme1" id = "obrisi">Obrisi</a>
                <a href="/promenavrednosti/${response.data.id}"  class = "dugme1" id = "update">Update</a>
                </div>
        </div>`;
            res.send(procitajStranicuZaNaziv("sviproizvodi").replace("#{data}", prikaz))
        })
        .catch(error => {
            console.log(error)
        })
})

//Funkcija za prolazak kroz sve oznake
const prikaziOznake = (proizvod) => {
    let spisak = ""
    proizvod.oznaka.forEach(oznaka => spisak += `<span style = "margin-right:10px">${oznaka}</span>`)
    return spisak
}

//Brisanje proizvoda i povratak na stranicu gde se nalaze svi proizvodi
app.get("/obrisi/:id", (req, res) => {
    axios.delete(`http://localhost:3000/deleteproizvod/${req.params["id"]}`)
    res.redirect("/sviproizvodi")
})

//Stranica za dodavanje proizvoda
app.get("/dodajproizvod", (req, res) => {
    res.send(procitajStranicuZaNaziv("formazadodavanje"));
});

//Snimanje proizvoda i povratak na stranicu za dodavanje novog proizvoda
app.post("/snimiproizvod", (req, res) => {
    const nizOznaka = req.body.oznaka.split(" ")
    axios.post("http://localhost:3000/addproizvod", {
        tekstProizvoda: req.body.tekstProizvoda,
        cena: req.body.cena,
        kategorijaProizvoda: req.body.kategorijaProizvoda,
        oznaka: [req.body.tekstProizvoda, req.body.kategorijaProizvoda, ...nizOznaka]
    })
    res.redirect("/sviproizvodi");
})

//Pretraga proizvoda po oznaci proizvoda
app.post("/filtrirajproizvodzaoznaku", (req, res) => {
    axios.get(`http://localhost:3000/getproizvodbyoznaka?oznaka=${req.body.oznaka}`)
        .then(response => {
            let prikaz = ""
            response.data.forEach(element => {
                prikaz += `<div class="kartica">
                <div class="ime">${element.tekstProizvoda}</div>
                <div class = "cena">${element.cena}rsd.</div>
                <div class = "detaljnije"><a href="/detaljnije/${element.id}">Detaljnije</a></div>
                <div class = "dugme">
                <a href="/obrisi/${element.id}" class = "dugme1" id = "obrisi">Obrisi</a>
                <a href="/promenavrednosti/${element.id}"  class = "dugme1" id = "update">Update</a>
                </div>
            </div>`
            })
            res.send(procitajStranicuZaNaziv("sviproizvodi").replace("#{data}", prikaz))
        })
})

//Filtriranje proizvoda po kategoriji
app.post("/filtrirajproizvodzakategoriju", (req, res) => {
    axios.get(`http://localhost:3000/getproizvodbykategorija?kategorijaProizvoda=${req.body.kategorijaProizvoda}`)
        .then(response => {
            let prikaz = ""
            response.data.forEach(element => {
                prikaz += `<div class="kartica">
                <div class="ime">${element.tekstProizvoda}</div>
                <div class = "cena">${element.cena}rsd.</div>
                <div class = "detaljnije"><a href="/detaljnije/${element.id}">Detaljnije</a></div>
                <div class = "dugme">
                <a href="/obrisi/${element.id}" class = "dugme1" id = "obrisi">Obrisi</a>
                <a href="/promenavrednosti/${element.id}"  class = "dugme1" id = "update">Update</a>
                </div>
            </div>`
            })
            res.send(procitajStranicuZaNaziv("sviproizvodi").replace("#{data}", prikaz))
        })
})

//Ucitavanje vrednosti  za izabrani proizvod koji hocemo da update
app.get("/promenavrednosti/:id", (req, res) => {
    axios.get(`http://localhost:3000/sviproizvodi`)
        .then(response => {
            let prikaz = ""
            response.data.forEach(element => {
                if (element.id == req.params["id"]) {
                    prikaz += `<form action="/update/${element.id}" method="post"><div>
            <div><label>Naziv proizvoda:</label><input type="text" value="${element.tekstProizvoda}" name="tekstProizvoda"></div>
            <div><label>Cena proizvoda:</label><input type="number" value="${element.cena}"  name="cena"></div>
            <div>   
            <label>Kategorija proizvoda:</label><select name="kategorijaProizvoda" id="kategorijaProizvoda">
                <option value="laptopovi">Laptopovi</option>
                <option value="stolice">Stolice</option>
                <option value="tastature">Tastature</option>
            </select>
            </div>
            <div><label>Oznake proizvoda:</label><input type="text" value="${element.oznaka}"  name="oznaka"></div>
            <div><button type="submit">Update</button></div></div></form> `
                }
            })
            res.send(procitajStranicuZaNaziv("update").replace("#{data}", prikaz))
        })
        .catch(error => {
            console.log(error)
        })
})

//Update vrednosti proizvoda
app.post("/update/:id", (req, res) => {
    axios.post(`http://localhost:3000/updateproizvoda/${req.params["id"]}`, {

        tekstProizvoda: req.body.tekstProizvoda,
        cena: req.body.cena,
        kategorijaProizvoda: req.body.kategorijaProizvoda,
        oznaka: req.body.oznaka
    })
        .catch(error => {
            console.log(error)
        })
    res.redirect("/sviproizvodi")

})


app.listen(port, () => { console.log(`klijent na portu ${port}`) })