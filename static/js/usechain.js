/**
 * usechain.js
 * Usechain client javascript for communicating with nodes.
 *
 * Author: zhouhh
 * Date:   2018/7/6.
 *
 * Copyright 2018-2020 Usechain
 *
 */
"use strict";
//var cfg =require( "./config.js");
var cfg= {
    "usthost": "http://192.168.3.6:8545"
}
//var Web3 = require( './web3j/web3.js');

var web3 = new Web3();

let wallet
const z64 = "0000000000000000000000000000000000000000000000000000000000000000"
function log(){
    //alert("hello")
    console.log("log test called")
}

//init
function init() {

    if(!web3.currentProvider) {
        web3.setProvider(new web3.providers.HttpProvider(cfg.usthost));
    }
    if(!web3.currentProvider) {
        alert("connect to usechain nodes error!")
        throw new Error("connect error")
    }else{
        console.log("web3 connect success")
    }

    wallet = Wallet.fromPrivateKey(Buffer.from('4ac8a6c0effc132f35f77803d50e94e8d4ffde41cd500d81db2d1a5e89dd4ac3', 'hex'));
    console.log("wallet address:"+wallet.getAddressString())
    console.log("usechain.js init successfull")
    return wallet
}

// new wallet
function new_wallet(password) {
    var newwallet = Wallet.generate(false);
    wallet = newwallet

    var keystore = newwallet.toV3String(password, {
        kdf: "scrypt",
        n: 8192
    });

    //TODO: save to local file
    return keystore;
}

//download js object
function download(data) {
    //data = JSON.stringify(Obj);
    var urlObject = window.URL || window.webkitURL || window;

    var downloadData = new Blob([data]);

    var save_link = document.createElementNS("http://www.w3.org/1999/xhtml", "a")
    save_link.href = urlObject.createObjectURL(downloadData);
    save_link.download = "USB--" + Obj.address;
    var ev = document.createEvent("MouseEvents");
    ev.initMouseEvent(
        "click", true, false, window, 0, 0, 0, 0, 0
        , false, false, false, false, 0, null
    );
    save_link.dispatchEvent(ev);
    //fake_click(save_link);
}

//send transaction
function sendtx(tx) {
    console.log("sendtx")

    web3.eth.sendSignedTransaction(tx, function (err, hash) {
        if (!err) {
            console.log("transaction hash:" + hash);
            return hash;

        } else {
            console.log(err);
            return false;
        }
    });
}

function outputObj(obj) {
    var des = "";
    for (var name in obj) {
        des += name + ":" + obj[name] + ";";
    }
    console.log(des);
}


//format number to 64 byte string with zero.
function fmtNumberWithLead0(num) {
    var hex = num.toString(16)
    var hexstring = (z64 + hex).substring(hex.length)
    //console.log(hexstring)
    return hexstring
}

//format number to 64 byte string with zero.
function fmtStringWithTail0(str) {

    var strlen = fmtNumberWithLead0(str.length)
    var hexStr=strToAsciiHex(str)

    var tailLen = hexStr.length % 64
    var strWith0 = ""
    if (tailLen != 0) {
        strWith0 = strlen + (hexStr + z64).substring(0, hexStr.length + 64 - tailLen)
    } else {
        strWith0 = strlen+hexStr
    }

    console.log("fmt string："+strWith0)
    return strWith0
}

function strToAsciiHex(str){
    let hex=""
    for(let i=0;i<str.length;i++) {
        hex += str.charCodeAt(i).toString(16)
    }
    return hex
}

function fmtObjectWith0(obj) {
    var data = ""
    if (!obj.length) {
        throw new Error("object not supported:" + obj.toString())
    }

    for (let a of obj) {
        if (typeof a == "number") {
            data += fmtNumberWithLead0(a)
        }
        if (typeof a == "string") {
            data += fmtStringWithTail0(a)
        }
        if (typeof a == "object") {
            data += fmtObjectWith0(a)
        }
    }
}

//format data
function fmtData(funcDigest, ...args) {
    var data = ""
    console.log(args.length)
    var lens = new Array(args.length+1)

    lens[0] = args.length * 32

    //function digest, insert 0x, and cut to 8 byte
    if (funcDigest.substr(0, 2) != '0x') {
        funcDigest = '0x' + funcDigest
    }
    if (funcDigest.length > 10) {
        funcDigest = funcDigest.substr(0, 10)
    }

    //append args content
    args.forEach((a, i) => {

        if (typeof a == "number") {
            data += fmtNumberWithLead0(a)
        }
        if (typeof a == "string") {
            data += fmtStringWithTail0(a)
        }
        if (typeof a == "object") {
            data += fmtObjectWith0(a)
        }
        lens[i + 1] = lens[0] + data.length/2
        console.log("" + (i + 1) + " :" + lens[i + 1])
    })


    // insert offset value
    for (let j = args.length - 1; j >= 0; j--) {
        console.log("append len:" + j + " :" + lens[j])
        data = fmtNumberWithLead0(lens[j]) + data

    }

    //insert function
    data = funcDigest + data
    console.log("data:"+data)
    return data
}


var _txParams = {
        nonce:0,  //should be filled by caller
        gasPrice: '0x3B9ACA00',//1Gwei
        gasLimit: '0x33C20A', //3392010
        to:"0x00", // receiver,must not be empty
        value: '0x00',
        chainId: 555,

        // data to be sent.
        // 8byte function digest+first param offset,...nth param offset+[first param len if not number]+first param+...+[nth param len if not number]+nthparam
        // each section will be fill zeros until it is 64 bytes long.number fill the zero to header, string fill to tail.
        //'0xfdf03f86'+ "0000000000000000000000000000000000000000000000000000000000000060000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000001800000000000000000000000000000000000000000000000000000000000000061313131313131313131313131313131313131313131313131313131313131313131313131313131313131313131313131313131313131313131313131313131313131313131313131313131313131313131313131313131313131313131313131310000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000483232323232323232323232323232323232323232323232323232323232323232323232323232323232323232323232323232323232323232323232323232323232323232323232320000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000048333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333000000000000000000000000000000000000000000000000",
        data:"0x00",
}

// send user Addr to committee
// @param wallet
// @param to: receiver
// @param pamrms.gasPrice
//          pamrms.gasLimit
//          pamrms.value
//          pamrms.chainId
//          pamrms.data first order smart contract data.
// @param funcDigest: smart contract function digest,8 bytes with '0x'
// @param args: smart contract arguments to form data
//_pubKey, _sign, _CA
function sendAddr(wallet, params, funcDigest, ...args) {
    var nonce = web3.eth.getTransactionCount(wallet.getAddressString(), 'pending')

    var p = _txParams
    p.nonce = nonce
    if (params.gasPrice) p.gasPrice = params.gasPrice;
    if (params.gasLimit) p.gasLimit = params.gasLimit;
    if (!params.to) throw new Error("send to address is empty")
    p.to = params.to
    if (params.value) p.value = params.value
    if (params.chainId) p.chainId = params.chainId;
    if (params.data) {
        p.data = params.data
    } else {
        p.data = fmtData(funcDigest, ...args)

    }

    console.log("p.data:"+p.data)
    const tx = new Tx(p)

    var serializedTx = signTx(wallet, tx)
    sendTx(serializedTx)
}

// sign  transaction
function signTx(wallet, tx) {
    const privateKey = wallet.getPrivateKey()

    tx.sign(privateKey)
    const serializedTx = tx.serialize()
    console.log(serializedTx.toString('hex'));
    console.log(serializedTx.toString());
    return serializedTx;

}

// send transaction
function sendTx(serializedTx) {

    web3.eth.sendRawTransaction('0x' + serializedTx.toString('hex'), function (err, hash) {
            if (!err) {
                console.log("transaction hash:"+hash);
            } else {
                console.log(err)
            }
        }
    );

}