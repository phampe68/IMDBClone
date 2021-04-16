const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let notificationSchema = Schema({
    text: {type: String, required: true},
    user: {type: Schema.Types.ObjectId, required: true},
    link: {type: String, required: true}
});

let Notification = mongoose.model("Notification", notificationSchema);
module.exports = Notification;
