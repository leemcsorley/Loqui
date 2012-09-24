var couchapp = require("couchapp");
var ddoc = {_id:'_design/account', shows:{}, updates:{}, views:{}, lists:{}};

ddoc.views.byUsername = {
    map:function (doc) {
        if (doc.type == "user") {
            emit(doc.username, null);
        }
    }
};

ddoc.views.byEmail = {
    map:function (doc) {
        if (doc.type == "user") {
            emit(doc.email, null);
        }
    }
};

module.exports = ddoc;