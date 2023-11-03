"use strict";

const stringify = require("json-stringify-deterministic");
const sortKeysRecursive = require("sort-keys-recursive");
const { Contract } = require("fabric-contract-api");

class AssetTransfer extends Contract {
  async CreateAsset(
    ctx,
    id,
    donarId,
    donarName,
    donationAmount,
    donationPurpose
  ) {
    const exists = await this.AssetExists(ctx, id);
    if (exists) {
      throw new Error(`The asset ${id} already exists`);
    }

    const asset = {
      ID: id,
      DonarId: donarId,
      DonarName: donarName,
      DonationAmount: donationAmount,
      DonationPurpose: donationPurpose,
    };

    await ctx.stub.putState(
      id,
      Buffer.from(stringify(sortKeysRecursive(asset)))
    );
    return JSON.stringify(asset);
  }

  async ReadAsset(ctx, id) {
    const assetJSON = await ctx.stub.getState(id);
    if (!assetJSON || assetJSON.length === 0) {
      throw new Error(`The asset ${id} does not exist`);
    }
    return assetJSON.toString();
  }

  async UpdateAsset(
    ctx,
    id,
    donarId,
    donarName,
    donationAmount,
    donationPurpose
  ) {
    const exists = await this.AssetExists(ctx, id);
    if (!exists) {
      throw new Error(`The asset ${id} does not exist`);
    }

    const updatedAsset = {
      ID: id,
      DonarId: donarId,
      DonarName: donarName,
      DonationAmount: donationAmount,
      DonationPurpose: donationPurpose,
    };

    return ctx.stub.putState(
      id,
      Buffer.from(stringify(sortKeysRecursive(updatedAsset)))
    );
  }

  async DeleteAsset(ctx, id) {
    const exists = await this.AssetExists(ctx, id);
    if (!exists) {
      throw new Error(`The asset ${id} does not exist`);
    }
    return ctx.stub.deleteState(id);
  }

  async AssetExists(ctx, id) {
    const assetJSON = await ctx.stub.getState(id);
    return assetJSON && assetJSON.length > 0;
  }

  // async TransferAsset(ctx, id, newOwner) {
  //   const assetString = await this.ReadAsset(ctx, id);
  //   const asset = JSON.parse(assetString);
  //   const oldOwner = asset.Owner;
  //   asset.Owner = newOwner;
  //   await ctx.stub.putState(
  //     id,
  //     Buffer.from(stringify(sortKeysRecursive(asset)))
  //   );
  //   return oldOwner;
  // }

  async GetAllAssets(ctx) {
    const allResults = [];
    const iterator = await ctx.stub.getStateByRange("", "");
    let result = await iterator.next();
    while (!result.done) {
      const strValue = Buffer.from(result.value.value.toString()).toString(
        "utf8"
      );
      let record;
      try {
        record = JSON.parse(strValue);
      } catch (err) {
        console.log(err);
        record = strValue;
      }
      allResults.push(record);
      result = await iterator.next();
    }
    return JSON.stringify(allResults);
  }
}

module.exports = AssetTransfer;
