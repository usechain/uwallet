/**
 * Created by zhouhh on 2018/7/8.
 */
import sendtx from  "../js/usechain.js"
var tcert=getTcert();
const txParams = {
    nonce: 0,
    gasPrice: '0x3B9ACA00',
    gasLimit: '0x33C20A',
    to: '0xcc73428bD9B2a5bbCd49289C1e1966D24b50433D',
    value: '0x00',
    //data: '0x' + '60fe47b1' + '000000000000000000000000000000000000000000000000000000000000000a'
    // nonce: '0x14',
    // gasPrice: '0x3B9ACA00',
    // gasLimit: '0xC20A',
    // to: '0x8c60e6a473bedb869edf0ae5991fecb7ebdb6aee',
    // value: '0x00',
    //前缀32位 共64个16进制字符
    data: '0x' + 'd95f1e84'+ '0000000000000000000000000000000000000000000000000000000'+ level + tcert,
    // data: '0x7f7465737432000000000000000000000000000000000000000000000000000000600057',
    // chainId: 3
}

sendtx(txParams);