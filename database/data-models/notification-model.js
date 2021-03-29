const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let notificationSchema = Schema({
    text: {type: String},
    relatedID: {type: Schema.Types.ObjectId},
    link: {type: String}
});

let Notification = mongoose.model("Notification", notificationSchema);
module.exports = Notification;