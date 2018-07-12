<template>

    <div id="wrapper">


        <img id="logo" src="~@/assets/logo.png" alt="usechain">
        <main>
            <div class="left-side">
        <span class="title">
          Welcome to Usechain wallet!
        </span>
                <system-information></system-information>
            </div>

            <div class="right-side">
                <div class="doc">
                    <div class="title">Getting Started</div>
                    <p>
                        Usechain wallet.
                    </p>
                    <button @click="open('https://usechain.net/')">Read the official website</button>
                    <br><br>
                </div>
                <div>
                    <button @click="sendTransaction()">sendTransaction</button>
                    <button @click="newWallet()">new Wallet</button>
                    <button @click="csr()">csr req</button>
                </div>
                <div class="doc">
                    <div class="title alt">white paper</div>
                    <button class="alt" @click="open('https://usechain.net/usechain_en.pdf')">Project white paper
                    </button>
                    <button class="alt" @click="open('https://usechain.net/usechain_tech_en.pdf')">
                        Technical white paper
                    </button>
                </div>
            </div>
        </main>
    </div>
</template>

<script>
    import SystemInformation from './LandingPage/SystemInformation'

    export default {
        name: 'landing-page',
        components: {SystemInformation},
        methods: {
            open (link) {
                this.$electron.shell.openExternal(link)
            },
            sendTransaction(){
                var wallet = init();
                //function sendAddr(wallet, to, params, funcDigest, ...args)
                var to = "0xa9213f4994ced932bbd39d14b582cd9e1fa3cd0e"
                var params = {

                    chainId: 555,
                    to: to,
                    //data:data
                }

                sendAddr(wallet, params, "0xfdf03f86", "123435476598987093287453875487", "def", "zzzzzzzzba57c85fa41a3bb00c9fcddf8506246f1ab3c445ba016a8b35147e5c951f4ddd0f6cf0b204525cf59af81fb24273accf0b204525cf59af81fb24273cf0b204525cf59af81fb24273eb74242de824dxyz");

            },
            newWallet(){
                var keystore = new_wallet("123456")
                console.log(keystore)
            },
             csr(){
                 function arrayBufferToHex(buf) {
                     var hex = "";
                     var bufView = new Uint8Array(buf);
                     for (var i = 0; i < bufView.length; i++) {
                         let val = bufView[i].toString(16)
                         if (val < 16) val = "0" + val
                         hex += val
                     }
                     return hex;
                 }
                async function createCSR() {
//                    var id = document.getElementById("idnumber");
//                    var hashAlg = document.getElementById("hashAlg");
//                    var signAlg = document.getElementById("signAlg");
//                    var result = document.getElementById("pem-text-block");
                    var hash = await genKeyHash("12342354346543", "sha-256");
                    // Promise.all([hashPromise]).then(v=console.log("hash"))
                    var config={}
                    config.commonName = arrayBufferToHex(hash)

                    //testabc()
                    config.hashAlg = "SHA-256";
                    config.signAlg = "RSASSA-PKCS1-v1_5";
                    config.countryName="China"
                    config.organizationName="Usechain"
                    config.organizationalUnitName="Usechain bj"
                    config.stateOrProvinceName="beijing"
                    config.email="zhouhh@usechain.net"


                    var pemPromise = createPKCS10PEM(config)
                    pemPromise.then((value) => {console.log(value)
                    console.log("csr:\n"+value);
                    },
                    error =>console.error(error)
                    )

                }
                 createCSR();
//                config={
//                    this.commonName=""
//                this.countryName=getParametersValue(parameters, "countryName", CSRConfig.defaultValues("countryName"));
//                this.hashAlg=getParametersValue(parameters,"hashAlg",CSRConfig.defaultValues("hashAlg"))
//                this.signAlg=getParametersValue(parameters,"signAlg",CSRConfig.defaultValues("signAlg"))
//                this.email=getParametersValue(parameters,"email",CSRConfig.defaultValues("email"))
//                this.domain=getParametersValue(parameters,"domain",CSRConfig.defaultValues("domain"))
//                this.anotherdomain=getParametersValue(parameters,"anotherdomain",CSRConfig.defaultValues("anotherdomain"))
//                this.iPAddress=getParametersValue(parameters,"iPAddress",CSRConfig.defaultValues("iPAddress"))
//                this.organization
//                this.organizationalUnit
//                this.stateOrProvinceName
//                this.streetAddress
//                }
                //createPKCS10(config,"PEM")

            }
        }
    }
</script>

<style>
    @import url('https://fonts.googleapis.com/css?family=Source+Sans+Pro');

    * {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
    }

    body {
        font-family: 'Source Sans Pro', sans-serif;
    }

    #wrapper {
        background: radial-gradient(
                ellipse at top left,
                rgba(255, 255, 255, 1) 40%,
                rgba(229, 229, 229, .9) 100%
        );
        height: 100vh;
        padding: 60px 80px;
        width: 100vw;
    }

    #logo {
        height: auto;
        margin-bottom: 20px;
        width: 40px;
    }

    main {
        display: flex;
        justify-content: space-between;
    }

    main > div {
        flex-basis: 50%;
    }

    .left-side {
        display: flex;
        flex-direction: column;
    }

    .welcome {
        color: #555;
        font-size: 23px;
        margin-bottom: 10px;
    }

    .title {
        color: #2c3e50;
        font-size: 20px;
        font-weight: bold;
        margin-bottom: 6px;
    }

    .title.alt {
        font-size: 18px;
        margin-bottom: 10px;
    }

    .doc p {
        color: black;
        margin-bottom: 10px;
    }

    .doc button {
        font-size: .8em;
        cursor: pointer;
        outline: none;
        padding: 0.75em 2em;
        border-radius: 2em;
        display: inline-block;
        color: #fff;
        background-color: #4fc08d;
        transition: all 0.15s ease;
        box-sizing: border-box;
        border: 1px solid #4fc08d;
    }

    .doc button.alt {
        color: #42b983;
        background-color: transparent;
    }
</style>
