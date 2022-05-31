//Rishav Gupta 

const fs = require('fs');
const http = require('http');
const https = require('https');
const server = http.createServer();
const port = 3000;
const authorization1 = require("./authorization/oxfordauthorization.json");
const authorization2 = require("./authorization/pexelauthorization.json");

server.on("listening", listeningHandler);
server.listen(port);
function listeningHandler(){
    console.log(`now listening on port ${port}`);
}

server.on('request', requestHandler);
function requestHandler(req, res){
    console.log(req.url);
    if(req.url === "/"){//main page
        const form = fs.createReadStream("main.html");
        res.writeHead(200, {"Content-Type":'text/html'})
        form.pipe(res);

    }

    else if(req.url.startsWith("/search")){
        const userInput = new URL(req.url, `https://${req.headers.host}`).searchParams;//creates a url
        const userWord = userInput.get('word');
        if(userWord == ""){//if the user enters in no word
            res.end("<h1>Please enter a word</h1>");
        }
        res.writeHead(200, {"Content-Type": "text/html"});
            searchDef(userWord,res);

    }

    else{//for errors
        res.writeHead(404, {"Content-Type":"text/html"});
        res.end("<h1>Not Found</h1>");
    }

}


function searchDef(userWord, res){
    const apiRequest = `https://od-api.oxforddictionaries.com/api/v2/entries/en-gb/${userWord}?fields=definitions`;//url to retrieve definition
    const getDefinition = https.get(apiRequest, {method:"GET", headers:authorization1});
    getDefinition.on("response", processStream);
    getDefinition.end();
    function processStream(definitionStream){
        let definition = "";//puts the definition in here
        definitionStream.on("data", chunk => definition += chunk);//in a data event, adds a chunk to the def
        definitionStream.on("end", ()=> parseAndShowDefinition(definition, userWord, res));//exit
    }
}


function parseAndShowDefinition(body,userWord, res){
    const definitionObj = JSON.parse(body);//turns raw data into a json

    if(definitionObj.error || definitionObj.message){
        res.writeHead(404, {"Content-Type":"text/html"});
        console.log("no definition available");
      api1result=`<h1>no definition available</h1>`;


    }

    else{

        const finalDef = definitionObj.results[0].lexicalEntries[0].entries[0].senses[0].definitions;
        res.writeHead(200, {"Content-Type":"text/html"});
        console.log("definitions shown");
        api1result= `<h1>${definitionObj.word} </h1><p>${finalDef}</p>`;


    }
    getPicture(userWord,api1result, res);
}

function getPicture(userWord, api1result, res){
    const apiRequest2 = `https://api.pexels.com/v1/search?query=${userWord}&per_page=1`;
    const picture = https.get(apiRequest2, {method:"GET", headers:authorization2});
    picture.on("response", processStream);
    function processStream(pictureStream){
        let pic = "";//puts the picture data in here
        pictureStream.on("data", chunk => pic += chunk);//in a data event, adds a chunk to pic
        pictureStream.on("end", ()=> parseAndShowPicture(pic,api1result, res));//end event
    }
}

function parseAndShowPicture(pic, api1result, res){
    const pictureObject = JSON.parse(pic);

    if(pictureObject.photos.length==0 || pictureObject.photos.length== null){
        result= `${api1result}<br><h2>no picture available</h2>`;
        console.log("no picture available");
        res.write(result);
    }

    else{
         const finalPic = pictureObject.photos[0].src.large;
         res.writeHead(200, {"Content-Type":"text/html"});
         console.log(finalPic);
         result= `${api1result}<img src=${finalPic}>`;
         res.write(result);
         res.end();
    }

}
