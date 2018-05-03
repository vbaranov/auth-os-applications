// Script exec and storage contracts
let ScriptExec = artifacts.require('./ScriptExec')
let AbstractStorage = artifacts.require('./RegistryStorage')
// Script registry
let InitRegistry = artifacts.require('./InitRegistry')
let AppConsole = artifacts.require('./AppConsole')
let VersionConsole = artifacts.require('./VersionConsole')
let ImplConsole = artifacts.require('./ImplementationConsole')
// MintedCappedCrowdsale
let InitMintedCapped = artifacts.require('./InitCrowdsale')
let MintedCappedBuy = artifacts.require('./CrowdsaleBuyTokens')
let MintedCappedCrowdsaleConsole = artifacts.require('./CrowdsaleConsole')
let MintedCappedTokenConsole = artifacts.require('./TokenConsole')
let MintedCappedTokenTransfer = artifacts.require('./TokenTransfer')
let MintedCappedTokenTransferFrom = artifacts.require('./TokenTransferFrom')
let MintedCappedTokenApprove = artifacts.require('./TokenApprove')

// Utils
let RegistryUtils = artifacts.require('./utils/RegistryUtils')
let RegistryGetters = artifacts.require('./utils/RegistryGetters')

contract('RegistryApps-TokenWizard', function(accounts) {
  let storage

  let initRegistry
  let initRegistryCalldata = '0xe1c7392a' // sha3('init()')
  let appConsole
  let versionConsole
  let implConsole

  let scriptUpdater = accounts[0]
  let registryExecId
  let registryContext

  let registryUtils
  let registryGetters

  let networkID

  // Before - deploy storage contract and script registry contracts
  before(async () => {
    storage = await AbstractStorage.new().should.be.fulfilled
    exec = await ScriptExec.new(scriptUpdater, storage.address, web3.sha3(scriptUpdater)).should.be.fulfilled

    registryUtils = await RegistryUtils.new().should.be.fulfilled
    registryGetters = await RegistryGetters.new().should.be.fulfilled

    // Script Registry
    initRegistry = await InitRegistry.new().should.be.fulfilled
    appConsole = await AppConsole.new().should.be.fulfilled
    versionConsole = await VersionConsole.new().should.be.fulfilled
    implConsole = await ImplConsole.new().should.be.fulfilled

    // Initialize and finalize a registry application within storage, and get its exec id
    let events = await storage.initAndFinalize(
      scriptUpdater, false, initRegistry.address, initRegistryCalldata, [
        appConsole.address,
        versionConsole.address,
        implConsole.address
      ], { from: scriptUpdater }
    ).should.be.fulfilled.then((tx) => {
        return tx.logs
    })

    events.should.not.eq(null)
    // We're expecting ApplicationInitialized and ApplicationFinalization events, both of which will have an indexed exec id
    events.length.should.be.eq(2)

    let initEvent = events[0]
    let finalizationEvent = events[1]

    initEvent.event.should.be.eq('ApplicationInitialized')
    finalizationEvent.event.should.be.eq('ApplicationFinalization')

    registryExecId = initEvent.args['execution_id']
    registryExecId.should.be.eq(finalizationEvent.args['execution_id'])
    registryExecId.should.not.eq(0)

    // Get the context bytes array for the script updater
    registryContext = await registryUtils.getContext.call(registryExecId, scriptUpdater, 0)
    registryContext.should.not.eq('0x')
    networkID = await web3.version.network
  })

  // 'after' hook - displays information about script registry and storage contracts
  after(async () => {
    console.log("=====================================")
    console.log("Storage address: " + storage.address)
    console.log("=====================================")
    console.log("Registry App: ")
    console.log("Exec ID: " + registryExecId)
    console.log("InitRegistry address: " + initRegistry.address)
    console.log("AppConsole address: " + appConsole.address)
    console.log("VersionConsole address: " + versionConsole.address)
    console.log("ImplementationConsole address: " + implConsole.address)
    console.log("ScriptExec address: " + exec.address)
    console.log("=====================================")
  })

  // Deployment of MintedCappedCrowsale files and registration within script registry
  describe('MintedCappedCrowdsale', async () => {

    // Init
    let initCrowdsale

    // Crowdsale
    let crowdsaleBuy
    let crowdsaleConsole

    // Token
    let tokenConsole
    let tokenTransfer
    let tokenTransferFrom
    let tokenApprove

    before(async () => {
      // Deploy all contracts in MintedCappedCrowdsale
      initCrowdsale = await InitMintedCapped.new().should.be.fulfilled

      crowdsaleBuy = await MintedCappedBuy.new().should.be.fulfilled
      crowdsaleConsole = await MintedCappedCrowdsaleConsole.new().should.be.fulfilled

      tokenConsole = await MintedCappedTokenConsole.new().should.be.fulfilled
      tokenTransfer = await MintedCappedTokenTransfer.new().should.be.fulfilled
      tokenTransferFrom = await MintedCappedTokenTransferFrom.new().should.be.fulfilled
      tokenApprove = await MintedCappedTokenApprove.new().should.be.fulfilled
    })

    // 'after' hook - displays information about deployed and registered applications
    after(async () => {
      console.log("=====================================")
      console.log("Finished deployment and registration of MintedCappedCrowdsale contracts...")
      console.log("=====================================")
      console.log("App name: MintedCappedCrowdsale")
      console.log("Version: v0.1")
      console.log("InitCrowdsale address: " + initCrowdsale.address)
      console.log("CrowdsaleBuyTokens address: " + crowdsaleBuy.address)
      console.log("CrowdsaleConsole address: " + crowdsaleConsole.address)
      console.log("TokenConsole address: " + tokenConsole.address)
      console.log("TokenTransfer address: " + tokenTransfer.address)
      console.log("TokenTransferFrom address: " + tokenTransferFrom.address)
      console.log("TokenApprove address: " + tokenApprove.address)
      console.log("=====================================")

      //generates .env variables:
      console.log(`REACT_APP_REGISTRY_STORAGE_ADDRESS='{"${networkID}":"${storage.address}"}'`)
      console.log(`REACT_APP_INIT_REGISTRY_ADDRESS='{"${networkID}":"${initRegistry.address}"}'`)
      console.log(`REACT_APP_APP_CONSOLE_ADDRESS='{"${networkID}":"${appConsole.address}"}'`)
      console.log(`REACT_APP_VERSION_CONSOLE_ADDRESS='{"${networkID}":"${versionConsole.address}"}'`)
      console.log(`REACT_APP_IMPLEMENTATION_CONSOLE_ADDRESS='{"${networkID}":"${implConsole.address}"}'`)
      console.log(`REACT_APP_SCRIPT_EXEC_ADDRESS='{"${networkID}":"${exec.address}"}'`)
      console.log(`REACT_APP_MINTED_CAPPED_CROWDSALE_INIT_CROWDSALE_ADDRESS='{"${networkID}":"${initCrowdsale.address}"}'`)
      console.log(`REACT_APP_MINTED_CAPPED_CROWDSALE_TOKEN_CONSOLE_ADDRESS='{"${networkID}":"${tokenConsole.address}"}'`)
      console.log(`REACT_APP_MINTED_CAPPED_CROWDSALE_CROWDSALE_CONSOLE_ADDRESS='{"${networkID}":"${crowdsaleConsole.address}"}'`)
      console.log(`REACT_APP_MINTED_CAPPED_CROWDSALE_CROWDSALE_BUY_TOKENS_ADDRESS='{"${networkID}":"${crowdsaleBuy.address}"}'`)
      console.log("=====================================")
    })

    context('Register App - MintedCappedCrowdsale', async () => {

      it('should correctly register the MintedCappedCrowdsale app', async () => {
        // AppConsole.registerApp - get calldata from RegistryUtils
        let registerAppCalldata = await registryUtils.registerApp.call(
          web3.fromAscii('MintedCappedCrowdsale', 32),
          storage.address,
          'A crowdsale which implements token minting, whitelisting, and a tiered sale setup',
          registryContext
        )
        registerAppCalldata.should.not.eq('0x')

        // Execute AppConsole.registerApp through storage, and read events to ensure valid execution
        let events = await storage.exec(
          appConsole.address, registryExecId, registerAppCalldata, { from: scriptUpdater }
        ).should.be.fulfilled.then((tx) => {
          return tx.logs
        })

        events.should.not.eq(null)
        events.length.should.be.eq(1)

        let registerAppEvent = events[0]
        // Ensure the application executed correctly -
        try {
          registerAppEvent.event.should.be.eq('ApplicationExecution')
        } catch (error) {
          // Event was not 'ApplicationExecution' - expect 'ApplicationException', instead
          registerAppEvent.event.should.be.eq('ApplicationException')
          // Get returned error message
          let errorMessage = registerAppEvent.args['message']
          assert.fail(registerAppEvent.event, 'ApplicationException',
            'AppConsole.registerApp failed with message: ' + web3.toAscii(errorMessage)
            + "\nApplication address: " + appConsole.address
            + "\nExecution id: " + registryExecId
            + "\nContext: " + registryContext
          )
        }

        // VersionConsole.registerVersion - get calldata from RegistryUtils
        let registerVersionCalldata = await registryUtils.registerVersion.call(
          web3.fromAscii('MintedCappedCrowdsale', 32),
          web3.fromAscii('v0.1', 32),
          storage.address,
          'Initial version',
          registryContext
        )
        registerVersionCalldata.should.not.eq('0x')

        // Execute AppConsole.registerApp through storage, and read events to ensure valid execution
        events = await storage.exec(
          versionConsole.address, registryExecId, registerVersionCalldata, { from: scriptUpdater }
        ).should.be.fulfilled.then((tx) => {
          return tx.logs
        })

        events.should.not.eq(null)
        events.length.should.be.eq(1)

        let registerVersionEvent = events[0]
        // Ensure the application executed correctly -
        try {
          registerVersionEvent.event.should.be.eq('ApplicationExecution')
        } catch (error) {
          // Event was not 'ApplicationExecution' - expect 'ApplicationException', instead
          registerVersionEvent.event.should.be.eq('ApplicationException')
          // Get returned error message
          let errorMessage = registerVersionEvent.args['message']
          assert.fail(registerVersionEvent.event, 'ApplicationException',
            'VersionConsole.registerVersion failed with message: ' + web3.toAscii(errorMessage)
            + "\nApplication address: " + versionConsole.address
            + "\nExecution id: " + registryExecId
            + "\nContext: " + registryContext
          )
        }

        // ImplementationConsole.addFunctions - get calldata from RegistryUtils
        let addFunctionsCalldata = await registryUtils.addFunctions.call(
          web3.fromAscii('MintedCappedCrowdsale', 32),
          web3.fromAscii('v0.1', 32),
          ['0xdead', '0xdead', '0xdead', '0xdead', '0xdead', '0xdead'],
          [
            crowdsaleBuy.address,
            crowdsaleConsole.address,
            tokenConsole.address,
            tokenTransfer.address,
            tokenTransferFrom.address,
            tokenApprove.address
          ],
          registryContext
        )
        addFunctionsCalldata.should.not.eq('0x')

        // Execute AppConsole.registerApp through storage, and read events to ensure valid execution
        events = await storage.exec(
          implConsole.address, registryExecId, addFunctionsCalldata, { from: scriptUpdater }
        ).should.be.fulfilled.then((tx) => {
          return tx.logs
        })

        events.should.not.eq(null)
        events.length.should.be.eq(1)

        let addFunctionsEvent = events[0]
        // Ensure the application executed correctly -
        try {
          addFunctionsEvent.event.should.be.eq('ApplicationExecution')
        } catch (error) {
          // Event was not 'ApplicationExecution' - expect 'ApplicationException', instead
          addFunctionsEvent.event.should.be.eq('ApplicationException')
          // Get returned error message
          let errorMessage = addFunctionsEvent.args['message']
          assert.fail(addFunctionsEvent.event, 'ApplicationException',
            'ImplementationConsole.addFunctions failed with message: ' + web3.toAscii(errorMessage)
            + "\nApplication address: " + implConsole.address
            + "\nExecution id: " + registryExecId
            + "\nContext: " + registryContext
          )
        }

        // VersionConsole.finalizeVersion - get calldata from RegistryUtils
        let finalizeVersionCalldata = await registryUtils.finalizeVersion.call(
          web3.fromAscii('MintedCappedCrowdsale', 32),
          web3.fromAscii('v0.1', 32),
          initCrowdsale.address,
          '0xdead',
          'Initializes a MintedCappedCrowdsale',
          registryContext
        )
        finalizeVersionCalldata.should.not.eq('0x')

        // Execute AppConsole.registerApp through storage, and read events to ensure valid execution
        events = await storage.exec(
          versionConsole.address, registryExecId, finalizeVersionCalldata, { from: scriptUpdater }
        ).should.be.fulfilled.then((tx) => {
          return tx.logs
        })

        events.should.not.eq(null)
        events.length.should.be.eq(1)

        let finalizeVersionEvent = events[0]
        // Ensure the application executed correctly -
        try {
          finalizeVersionEvent.event.should.be.eq('ApplicationExecution')
        } catch (error) {
          // Event was not 'ApplicationExecution' - expect 'ApplicationException', instead
          finalizeVersionEvent.event.should.be.eq('ApplicationException')
          // Get returned error message
          let errorMessage = finalizeVersionEvent.args['message']
          assert.fail(finalizeVersionEvent.event, 'ApplicationException',
            'VersionConsole.finalizeVersion failed with message: ' + web3.toAscii(errorMessage)
            + "\nApplication address: " + versionConsole.address
            + "\nExecution id: " + registryExecId
            + "\nContext: " + registryContext
          )
        }
      })
    })
  })
})
