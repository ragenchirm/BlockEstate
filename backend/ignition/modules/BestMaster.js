const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");


module.exports = buildModule("BestMasterModule", (m) => {
  const bestMaster = m.contract("BestMaster");

  return { bestMaster };
});
