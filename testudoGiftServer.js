const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const http = require('http');
const path = require("path");

require("dotenv").config({ path: path.resolve(__dirname, '.env') })
const userName = process.env.MONGO_DB_USERNAME;
const password = process.env.MONGO_DB_PASSWORD;
const databaseAndCollection = {db: "CMSC335_FINAL_DB", collection:"testudosGifts"};
const { MongoClient, ServerApiVersion } = require('mongodb');
const { lookup } = require("dns");
const { getSystemErrorMap } = require("util");
const { response } = require("express");
const uri = `mongodb+srv://${userName}:${password}@cluster0.avv4sgl.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

const portNumber = 5000;

app.set("views", path.resolve(__dirname, "templates"));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended:false}));

app.get("/", (request, response) => {
   response.render("index");
});

app.get("/offering", (request, response) => {
   response.render("offering");
});

app.post("/submittedGift", async (request, response) => {
   const variables = {
      item: request.body.item,
      quantity: request.body.quantity,
      notes: request.body.notes
   }
   try {
      await client.connect();
      await client.db(databaseAndCollection.db).collection(databaseAndCollection.collection).insertOne(variables);
   } catch (e) {
      console.error(e);
   } finally {
      await client.close();
   }
   response.render("submittedGift", variables);
});

app.get("/cleanQuery", (request, response) => {
   response.render("cleanQuery");
});

app.post("/clean", async (request, response) => {
   try {
      await client.connect();
      let filter = {};
      const result = client.db(databaseAndCollection.db).collection(databaseAndCollection.collection).find(filter);
      if (result) {
         const items = await result.toArray();
         let numItems = 0;
         if (items.length > 0) {
            items.forEach(item => numItems += parseInt(item.quantity));
         }
         const variables = {
            numItems: numItems
         }
         response.render("clean", variables);
         await client.db(databaseAndCollection.db).collection(databaseAndCollection.collection).deleteMany({});
      } else {
         console.log("There's nothing to clean!");
      }
   } catch (e) {
      console.error(e);
   } finally {
      await client.close();
   }
});

app.listen(portNumber); 
console.log(`Success! Web Server for Testudo's Gifts started and running at http://localhost:${portNumber}`);

process.stdin.setEncoding("utf8");
const prompt = "Type 'stop' to shut down the server: ";
process.stdout.write(prompt);
process.stdin.on('readable', () => {
   let dataInput = process.stdin.read();
   if (dataInput !== null) {
      let command = dataInput.trim();
      if (command === "stop") {
         console.log("Shutting down the server...");
         console.log("===========================");
         process.exit(0);
      } else {
         console.log("Invalid command. Please try again!")
      }
      process.stdout.write(prompt);
      process.stdin.resume();
   }
});