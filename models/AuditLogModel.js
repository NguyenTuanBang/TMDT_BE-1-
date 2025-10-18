import mongoose from "mongoose";

const AuditLogSchema = new mongoose.Schema({
    entity_type: {
        type: String,
        enum: ["Product", "Store", "Promotion", "Order", "User"],
        required: true
    },
    entity_id: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        // liên kết động, hướng trực tiếp đến collection có tên nằm trong entity_type
        refPath: "entity_type"
    },
    action:{
        type: String,
        enum: ["create", "update", "delete", "status_change"]
    },
    changes:[{
        field: {type: String},
        oldValue:{type: mongoose.Schema.Types.Mixed},
        newValue:{type: mongoose.Schema.Types.Mixed},
    }],
    performedBy:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }
},{
    timestamps: true
})

const AuditLogModel = mongoose.model("AuditLog", AuditLogSchema)
export default AuditLogModel