"use strict";

const { Gateway, Wallets } = require("fabric-network");
const FabricCAServices = require("fabric-ca-client");
const path = require("path");
const { v4: uuidv4 } = require("uuid");
const jwtVerify = require("./middleware/auth.js");
const {
  buildCAClient,
  registerAndEnrollUser,
  enrollAdmin,
} = require("../../test-application/javascript/CAUtil.js");
const {
  buildCCPOrg1,
  buildWallet,
} = require("../../test-application/javascript/AppUtil.js");
const createServer = require("./rest.api.js");
const config = require("./config.js");
const jwt = require("./jwt.js");
const walletPath = path.join(__dirname, `${config.walletPath}`);

async function main() {
  function prettyJSONString(inputString) {
    return JSON.stringify(JSON.parse(inputString), null, 2);
  }
  try {
    const ccp = buildCCPOrg1();
    const caClient = buildCAClient(
      FabricCAServices,
      ccp,
      "ca.org1.example.com"
    );
    const wallet = await buildWallet(Wallets, walletPath);
    await enrollAdmin(caClient, wallet, config.mspOrg1);
    await registerAndEnrollUser(
      caClient,
      wallet,
      config.mspOrg1,
      config.org1UserId,
      "org1.department1"
    );

    const gateway = new Gateway();

    try {
      const server = createServer();
      server.post("/register", async (req, res, next) => {
        const { email, password } = req.body;
        try {
          const userId = `${email}_${password}`;
          console.log(userId);
          await registerAndEnrollUser(
            caClient,
            wallet,
            config.mspOrg1,
            userId,
            "org1.department1"
          );
          res.json({ meg: "user create successfully" });
        } catch (err) {
          console.log(err);
        }
        //
      });

      server.post("/login", async (req, res, next) => {
        const { email, password } = req.body;
        const userId = `${email}_${password}`;
        try {
          const isUser = await wallet.get(userId);
          console.log("is user", isUser);
          if (isUser) {
            const token = jwt.generateAccessToken({ userId: userId });
            res.json({ meg: "login successfully", token: `Bearer ${token}` });
          }
          res.json({ meg: "user unauthorized successfully" });
        } catch (err) {
          console.log(err);
        }
        //
      });

      server.post("/donations", jwtVerify, async (req, res, next) => {
        const donationId = uuidv4();
        const { userId } = req.user;
        console.log(req.body);
        const { donarName, donationAmount, donationPurpose } = req.body;
        try {
          await gateway.connect(ccp, {
            wallet,
            identity: userId,
            discovery: { enabled: true, asLocalhost: true },
          });
          const network = await gateway.getNetwork(config.channelName);

          const contract = network.getContract(config.chaincodeName);
          let result = await contract.submitTransaction(
            "CreateAsset",
            donationId,
            userId,
            donarName,
            donationAmount,
            donationPurpose
          );

          res.json({ meg: "donate successfully" });
        } catch (err) {
          res.json({ err: err });
          console.log(err);
        }
        //
      });

      server.put(
        "/donations/:donationId",
        jwtVerify,
        async (req, res, next) => {
          const { donationId } = req.params;
          const { userId } = req.user;
          const { donarName, donationAmount, donationPurpose } = req.body;
          try {
            await gateway.connect(ccp, {
              wallet,
              identity: userId,
              discovery: { enabled: true, asLocalhost: true },
            });
            const network = await gateway.getNetwork(config.channelName);
            const contract = network.getContract(config.chaincodeName);
            let result = await contract.evaluateTransaction(
              "AssetExists",
              donationId
            );
            if (result) {
              let result = await contract.submitTransaction(
                "UpdateAsset",
                donationId,
                userId,
                donarName,
                donationAmount,
                donationPurpose
              );

              res.json(JSON.parse(result.toString()));
            }
          } catch (err) {
            console.log(err);
          }
          //
        }
      );

      server.get(
        "/donations/:donationId",
        jwtVerify,
        async (req, res, next) => {
          const { donationId } = req.params;
          const { userId } = req.user;
          const { donarName, donationAmount, donationPurpose } = req.body;
          try {
            await gateway.connect(ccp, {
              wallet,
              identity: userId,
              discovery: { enabled: true, asLocalhost: true },
            });
            const network = await gateway.getNetwork(config.channelName);
            const contract = network.getContract(config.chaincodeName);
            let result = await contract.evaluateTransaction(
              "ReadAsset",
              donationId
            );

            res.json(JSON.parse(result.toString()));
          } catch (err) {
            console.log(err);
          }
          //
        }
      );

      server.get("/donations", jwtVerify, async (req, res, next) => {
        const { userId } = req.user;
        try {
          console.log("hello dhiman");
          const a = await gateway.connect(ccp, {
            wallet,
            identity: userId,
            discovery: { enabled: true, asLocalhost: true },
          });
          const network = await gateway.getNetwork(config.channelName);
          const contract = network.getContract(config.chaincodeName);
          let result = await contract.evaluateTransaction("GetAllAssets");
          res.json(JSON.parse(result.toString()));
        } catch (err) {
          console.log(err);
        }
        //
      });
      server.listen(5000, () => {
        console.log("server running on port 5000");
      });
    } finally {
      gateway.disconnect();
    }
  } catch (error) {
    console.error(`******** FAILED to run the application: ${error}`);
    process.exit(1);
  }
}

main();
