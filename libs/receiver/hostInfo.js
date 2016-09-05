'use strict';
// hostFile2 - FOR THE NEW DESTORE CONTRACT
const IPFS = require('./../ipfs/ipfs.js');
const Ethereum = require('./../ethereum/ethereum.js');
const path = require('path');
const Host = require('./../../models/Host.js');
const promisfy = require('es6-promisify');
const nestedHexToAscii = require('./../nestedHexToAscii');

const web3 = Ethereum.init();

/*
* Gets hash addresses from reciever contract and saves file info into Host db
* @receiverAddress {String} - reciever contract address
* @callback {Function} - returns the doc created from the Host.db storage
* @returns Promise - Array of objects of the receivers hash and corresponding sender and size
*/

module.exports = promisfy((callback) => {
  const options = {
    from: Ethereum.account
  };
  const docs = []; // the result promise and callback return
  Promise.all([Ethereum.deStore().receiverGetHashes(options), Ethereum.deStore().receiverGetSenders(options), Ethereum.deStore().receiverGetSizes(options)])
    .then(resArr => {
      const hexHashes = resArr[0];
      const hashes = nestedHexToAscii(hexHashes);
      const senders = resArr[1];
      const sizes = resArr[2];
      const promises = [];
      for (let i = 0; i < resArr[0].length; i++) {
        const doc = {
          fileSize: Number(sizes[i].toString(10)),
          hashAddress: hashes[i],
          senderAddress: senders[i],
          infoTime: new Date(),
          isHosted: false,
          hostTime: null
        };
        const promise = new Promise((resolve, reject) => {
          Host.db.insert(doc, (err, res) => {
            if (!err && res !== null) docs.push(res);
            resolve();
          });
        });
        promises.push(promise);
      }
      return Promise.all(promises);
    })
    .then(res => {
      callback(null, docs);
    })
    .catch(err => {
      callback(err, null);
    });
});
