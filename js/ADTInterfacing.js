/* Interfacing with transitions taking ADTs:
  - a user defined ADT: need format contract_address.type
  - a List: need to build the list using Nil and Cons, similar to scilla
  - an Option type (Amrit)

  {
            "constructor": "Some",
            "argtypes"   : [ "ByStr20" ],
            "arguments"  : [
                "0x1234567890123456789012345678906784567890"
            ]
    }

*/
const {
  setup,
  deploy_from_file,
  sc_call } = require("./blockchain.js");

const { BN, Long, units, bytes } = require('@zilliqa-js/util');

async function run()
{
  const tx_settings = {
    "gas_price": units.toQa('2000', units.Units.Li),
    "gas_limit": Long.fromNumber(50000),
    "attempts": Long.fromNumber(10),
    "timeout": 1000,
  };
  try { // deploy

    const init = [ { vname: '_scilla_version',     type: 'Uint32',   value: '0',}, ];
    [tx, sc] = await deploy_from_file("../contracts/ADTInterfacing.scilla", init);
    console.log("contract deployed @ ", sc.address);
    const sc_addr = sc.address.toLowerCase(); // Important: only lower case format works

    try { // call transition ABTest
      // Note the special type and value for a user defined ADT (AB here)
      let args = [ { vname: "v", type: `${sc_addr}.AB`,  value: {constructor: `${sc_addr}.A`, argtypes: [], arguments: [] }},];
      let tx = await sc.call(
        'ABTest',
        args,
        { version: setup.VERSION, amount: new BN(0), gasPrice: tx_settings.gas_price,
          gasLimit: tx_settings.gas_limit,  },
        tx_settings.attempts, tx_settings.timeout, true,
      );

      console.log("  .. ABTest: tx.receipt.event_logs[0].params:\n", tx.receipt.event_logs[0].params);

      try { // call ListTest with a 2 element string list ["A", "B"]
        // Note the special way of constructing the list using Nil and Cons (front inserting an element into existing list)
        const nil = {constructor: "Nil",  argtypes: ["String", ], arguments: [] };
        const lB  = {constructor: "Cons", argtypes: ["String"],   arguments: ["B", nil] };
        const lAB = {constructor: "Cons", argtypes: ["String"],   arguments: ["A", lB] };
        args =  [ { vname: 'list',  type: 'List String', value: lAB, }, ];
        let tx = await sc.call(
          'ListTest',
          args,
          { version: setup.VERSION, amount: new BN(0), gasPrice: tx_settings.gas_price,
            gasLimit: tx_settings.gas_limit,  },
          tx_settings.attempts, tx_settings.timeout, true,
        );

        console.log("  .. ListTest: tx.receipt.event_logs[0].params:\n", tx.receipt.event_logs[0].params);

      }
      catch (err) {
        console.log("ListTest(.): Error\n", err);
      }
    } catch (err) {
        console.log("ABTest(.): ERROR\n",err);
    }
  } catch (err) {
    console.log("deployment: ERROR\n",err);
  }
}

run();
