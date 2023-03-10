const mongoose = require("mongoose");
const path = require("path");

const uploadFile = async (file, filename, folder) => {
  var type = file.name.split(".").pop().toLowerCase();
  var name = `${filename}.${type}`;
  var fs_path = path.resolve("./", folder, name);
  var ext_path = `/${folder}/${name}`;

  await file.mv(fs_path);
  return ext_path;
};

const isNot = (value) => {
  return ["null", "undefined", "NaN", "[]", "{}", "false"].includes(value);
};

const parseFormData = (object) => {
  for (var key in object) {
    if (object[key] == "true") object[key] = true;
    if (object[key] == "false") object[key] = false;
    if (object[key] == "[]") object[key] = [];
    if (object[key] == "{}") object[key] = {};

    if (isNot(object[key])) object[key] = false;
  }

  return object;
};

const randomRange = (from, to, round = true) => {
  var rand = from + Math.random() * (to - from);
  if (round) rand = Math.round(rand);

  return rand;
};

const getOfferMinPrice = (offer) => {
  var price = 0;

  if (offer.type == "direct") {
    price = offer.offer_price;
  }
  if (offer.type == "auction") {
    price = offer.bids.length ? offer.bids[0].price : offer.min_bid;
  }
  if (offer.type == "both") {
    price = offer.bids.length ? offer.bids[0].price : offer.min_bid;
    if (offer.offer_price < price) price = offer.offer_price;
  }

  return price;
};

const calcLikesArray = (items, user_id) => {
  items.forEach((item) => {
    calcLikes(item, user_id);
  });
  return items;
};

const calcLikes = (item, user_id) => {
  if (typeof user_id == "object") {
    user_id = user_id.id;
  }

  if ("token" in item) {
    item.token = calcLikes(item.token, user_id);
    return item;
  }

  if (item.likes) {
    user_id
      ? (item.liked = !!item.likes.find((i) => String(i) == user_id))
      : (item.liked = false);
    item.likes = item.likes.length;
  } else {
    item.liked = false;
    item.likes = 0;
  }

  return item;
};

const paginator = async (page, query, model, per_page = 20) => {
  var count = await model.countDocuments(query);
  var output = {
    skip: 0,
    info: {}
  };

  if (page) {
    page -= 1;
    output.skip = page * per_page;
    // if (output.skip >= count)
    // 	return res.status(422).send({error: "Bad page number"});
  } else {
    output.info = {
      items_count: count,
      pages: Math.ceil(count / per_page),
      per_page
    };
  }

  return output;
};

const getMonthDifference = (startDate, endDate) => {
  return (
    endDate.getMonth() -
    startDate.getMonth() +
    12 * (endDate.getFullYear() - startDate.getFullYear())
  );
};

module.exports = {
  parseFormData,
  uploadFile,
  isNot,
  randomRange,
  getOfferMinPrice,
  calcLikes,
  calcLikesArray,
  paginator,
  getMonthDifference
};
