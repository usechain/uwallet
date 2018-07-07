/**
 * Created by zhouhh on 2018/7/7.
 */

'use strict';
require("promise");

var bWebcrypto = true;
var certificate = {
    hostname: 'hostname',
    country: "china",
    state: 'bj',
    city: 'bj',
    organization_unit: 'usechain bj',
    organization: 'usechain',
    algorithm: 'RSA',//ECC
    keysize: '256'
}

make_csr(certificate,null);

function make_csr(certf, context) {
    // #region Get a "crypto" extension
    //var promise = new Promise();
    var crypto = org.pkijs.getCrypto();
    if (typeof crypto == "undefined") {
        bWebcrypto = false;
        context.content = '';
        setTimeout(function() {
        //    promise.reject(new Error('No WebCrypto extension found'));
        }, 0);
        return ;
    }
    // #endregion

    // #region Prepare P10
    context = context || {};
    var sequence = Promise.resolve();
    var pkcs10_simpl = new org.pkijs.simpl.PKCS10();
    var publicKey;
    var privateKey;
    var hash_algorithm;
    hash_algorithm = "sha-256";

    var signature_algorithm_name, keylength;
    switch (certf.algorithm) {
        case "RSA":
            signature_algorithm_name = "RSASSA-PKCS1-V1_5";
            keylength = parseInt(certf.keysize);
            break;
        case "ECC":
            signature_algorithm_name = "ECDSA";
            switch (certf.keysize) {
                case 'secp256r1':
                    keylength = "P-256";
                    break;
                case 'secp384r1':
                    keylength = "P-384";
                    break;
                case 'secp521r1':
                    keylength = "P-521";
                    break;
            }
            break;
        default:
            ;
    }
    // #endregion

    // #region Put a static values
    pkcs10_simpl.version = 0;

    if (certf.country)
        pkcs10_simpl.subject.types_and_values.push(new org.pkijs.simpl.ATTR_TYPE_AND_VALUE({
            type: "2.5.4.6",
            value: new org.pkijs.asn1.PRINTABLESTRING({
                value: certf.country
            })
        }));

    if (certf.state)
        pkcs10_simpl.subject.types_and_values.push(new org.pkijs.simpl.ATTR_TYPE_AND_VALUE({
            type: "2.5.4.8",
            value: new org.pkijs.asn1.UTF8STRING({
                value: certf.state
            })
        }));

    if (certf.city)
        pkcs10_simpl.subject.types_and_values.push(new org.pkijs.simpl.ATTR_TYPE_AND_VALUE({
            type: "2.5.4.7",
            value: new org.pkijs.asn1.UTF8STRING({
                value: certf.city
            })
        }));

    if (certf.organization)
        pkcs10_simpl.subject.types_and_values.push(new org.pkijs.simpl.ATTR_TYPE_AND_VALUE({
            type: "2.5.4.11",
            value: new org.pkijs.asn1.UTF8STRING({
                value: certf.organization
            })
        }));

    if (certf.organization_unit)
        pkcs10_simpl.subject.types_and_values.push(new org.pkijs.simpl.ATTR_TYPE_AND_VALUE({
            type: "2.5.4.10",
            value: new org.pkijs.asn1.UTF8STRING({
                value: certf.organization_unit
            })
        }));

    pkcs10_simpl.subject.types_and_values.push(new org.pkijs.simpl.ATTR_TYPE_AND_VALUE({
        type: "2.5.4.3",
        value: new org.pkijs.asn1.UTF8STRING({
            value: certf.hostname
        })
    }));

    pkcs10_simpl.attributes = [];
    // #endregion

    // #region Create a new key pair
    sequence = sequence.then(function() {
        // Set hash algorithm
        var algorithm = org.pkijs.getAlgorithmParameters(signature_algorithm_name, "generatekey");
        if ("hash" in algorithm.algorithm)
            algorithm.algorithm.hash.name = hash_algorithm;
        // #endregion

        // Set key length
        switch (certf.algorithm) {
            case "RSA":
                algorithm.algorithm.modulusLength = keylength;
                break;
            case "ECC":
                algorithm.algorithm.namedCurve = keylength;
                break;
        }

        return crypto.generateKey(algorithm.algorithm, true, algorithm.usages);
    });
    // #endregion

    // #region Store new key in an interim variables
    sequence = sequence.then(function(keyPair) {
        publicKey = keyPair.publicKey;
        privateKey = keyPair.privateKey;
    }, function(error) {
        context.content = '';
        //alert("Error during key generation: " + error);
        deferred.reject("Error during key generation: " + error);
    });
    // #endregion

    // #region Exporting public key into "subjectPublicKeyInfo" value of PKCS#10
    sequence = sequence.then(function() {
        return pkcs10_simpl.subjectPublicKeyInfo.importKey(publicKey);
    });
    // #endregion

    // #region SubjectKeyIdentifier
    sequence = sequence.then(function(result) {
        return crypto.digest({
            name: "SHA-1"
        }, pkcs10_simpl.subjectPublicKeyInfo.subjectPublicKey.value_block.value_hex);
    }).then(function(result) {
        pkcs10_simpl.attributes.push(new org.pkijs.simpl.ATTRIBUTE({
            type: "1.2.840.113549.1.9.14", // pkcs-9-at-extensionRequest
            values: [(new org.pkijs.simpl.EXTENSIONS({
                extensions_array: [
                    new org.pkijs.simpl.EXTENSION({
                        extnID: "2.5.29.14",
                        critical: false,
                        extnValue: (new org.pkijs.asn1.OCTETSTRING({
                            value_hex: result
                        })).toBER(false)
                    })
                ]
            })).toSchema()]
        }));
    });
    // #endregion

    // #region Signing final PKCS#10 request
    sequence = sequence.then(function() {
        context.privateKey = pkcs10_simpl.sign(privateKey, hash_algorithm);
        return pkcs10_simpl.sign(privateKey, hash_algorithm);
    }, function(error) {
        context.content = '';
        //alert("Error during exporting public key: " + error);
        deferred.reject("Error during exporting public key: " + error);
    });
    // #endregion

    sequence.then(function(result) {
        var pkcs10_schema = pkcs10_simpl.toSchema();
        var pkcs10_encoded = pkcs10_schema.toBER(false);

        var result_string = "-----BEGIN CERTIFICATE REQUEST-----\r\n";
        result_string = result_string + formatPEM(window.btoa(arrayBufferToString(pkcs10_encoded)));
        result_string = result_string + "\r\n-----END CERTIFICATE REQUEST-----\r\n";
        context.content = result_string;
        $($("md-list-item")[6]).find("pre").html(result_string);
        $("md-progress-linear").hide();
        //document.getElementById("pem-text-block").value = result_string;
    }, function(error) {
        context.content = '';
        //alert("Error signing PKCS#10: " + error);
        deferred.reject("Error signing PKCS#10: " + error);
    });
    // #region Exporting pri'vate key
    sequence = sequence.then(function() {
        return crypto.exportKey("pkcs8", privateKey);
    });
    // #endregion
    sequence.then(function(result) {
        var private_key_string = String.fromCharCode.apply(null, new Uint8Array(result));
        var result_string = "\r\n-----BEGIN PRIVATE KEY-----\r\n";
        result_string = result_string + formatPEM(window.btoa(private_key_string));
        result_string = result_string + "\r\n-----END PRIVATE KEY-----";
        context.privateKey = result_string;
        deferred.resolve(context.content);
    }, function(error) {
        //alert("Error during exporting of private key: " + error);
        context.content = '';
        deferred.reject("Error during exporting of private key: " + error);
        context.support = false;
    });

    return deferred.promise;
}

function formatPEM(pem_string) {
    var string_length = pem_string.length;
    var result_string = "";

    for (var i = 0, count = 0; i < string_length; i++, count++) {
        if (count > 63) {
            result_string = result_string + "\r\n";
            count = 0;
        }

        result_string = result_string + pem_string[i];
    }

    return result_string;
}

function arrayBufferToString(buffer) {
    /// <summary>Create a string from ArrayBuffer</summary>
    /// <param name="buffer" type="ArrayBuffer">ArrayBuffer to create a string from</param>

    var result_string = "";
    var view = new Uint8Array(buffer);

    for (var i = 0; i < view.length; i++) {
        result_string = result_string + String.fromCharCode(view[i]);
    }

    return result_string;
}

function stringToArrayBuffer(str) {
    /// <summary>Create an ArrayBuffer from string</summary>
    /// <param name="str" type="String">String to create ArrayBuffer from</param>

    var stringLength = str.length;

    var resultBuffer = new ArrayBuffer(stringLength);
    var resultView = new Uint8Array(resultBuffer);

    for (var i = 0; i < stringLength; i++)
        resultView[i] = str.charCodeAt(i);

    return resultBuffer;
}