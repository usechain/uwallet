"use strict";

const ChaiAsPromised = require("chai-as-promised");
var chai=require('chai')
chai.use(ChaiAsPromised);
chai.should();
const Kyber = require("@usechain/kyberjs");
const secp256k1 = Kyber.curve.secp256k1;
const BN = require("bn.js");
const assert = require("chai").assert;

//const suite = new Kyber.curve.edwards25519.Curve;
const suite = new  secp256k1.Curve(secp256k1.Params.k256);
const RingSig = require("../static/js/ringsignature");

describe("RingSig", function () {
    it('should correctly sign and verify with only one signer', function () {
        let X = [suite.point()];
        console.log("X:",X)
        let mine = 0;
        //  callback - to generate random Uint8Array of given length
        //function callback(len){}
        var crypto=require("crypto")
        var v=crypto.randomBytes
        console.log("v",v(32))
        let x = suite.scalar().pick(v);
        console.log("x:",x)
        X[mine].mul(x);
        console.log("X[mine]:",X[mine])
        let M = Uint8Array.from(["0xab", "0xbc", 3, 4]);
        let sig = RingSig.Sign(suite, M, X, mine, x);
        console.log("sig:",sig)

        const goodMessageVerif = RingSig.Verify(suite, M, X, sig);
        console.log(`${goodMessageVerif}`)
        goodMessageVerif.valid.should.be.true;

        const badMessageVerif = RingSig.Verify(suite, Uint8Array.from([0, 1]), X, sig);
        badMessageVerif.valid.should.be.false;

    });

    // it('should correctly sign and verify with a group of anonymity', function () {
    //     let X = [];
    //     for (let i = 0; i < 3; i++) {
    //         var p=suite.point().pick()
    //         X.push(p)
    //         //console.log(`====================================${i},${p}`)
    //
    //     }
    //     console.log(`gen pubs:${X}`)
    //     let mine = 1;
    //     let x = suite.scalar().pick();//,pub:(59694398042444694047297360037953144561094464967878935594512662015729498232715,76097611986323295734584157450112706531924080064865923891194451572645881340808)
    //     //let x="066325c28e0746d60bc24b4bc3efd2484422ed0ea35ac6b7fdc5b6c2c864ee22"
    //     X[mine] = suite.point().mul(x);
    //     console.log(`mine priv:${x},pub:${X[mine]}`)
    //
    //     console.log(`insert mine pubs:${X}`)
    //
    //     let M = Uint8Array.from(["0xba", 2, "0xd", 4, 5]);
    //     let sig = RingSig.Sign(suite, M, X, mine, x);
    //     console.log(`group sig:len:${sig.length},${sig}`)
    //
    //     // let badMessageVerify = RingSig.Verify(suite, Uint8Array.from([1, 2]), X, sig);
    //     // badMessageVerify.valid.should.be.false;
    //
    //     let goodMessageVerify = RingSig.Verify(suite, M, X, sig);
    //     goodMessageVerify.valid.should.be.true;
    //
    // });


});