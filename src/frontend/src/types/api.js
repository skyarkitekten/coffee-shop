// Core data types (mirrored from backend)
export var ProfileStatus;
(function (ProfileStatus) {
    ProfileStatus["DRAFT"] = "draft";
    ProfileStatus["COMPLETE"] = "complete";
    ProfileStatus["SUSPENDED"] = "suspended";
})(ProfileStatus || (ProfileStatus = {}));
export var VerificationStatus;
(function (VerificationStatus) {
    VerificationStatus["PENDING"] = "pending";
    VerificationStatus["VERIFIED"] = "verified";
    VerificationStatus["REJECTED"] = "rejected";
    VerificationStatus["NOT_SUBMITTED"] = "not_submitted";
})(VerificationStatus || (VerificationStatus = {}));
export var TradeType;
(function (TradeType) {
    TradeType["ELECTRICIAN"] = "electrician";
    TradeType["PLUMBER"] = "plumber";
    TradeType["CARPENTER"] = "carpenter";
    TradeType["WELDER"] = "welder";
    TradeType["HVAC_TECHNICIAN"] = "hvac_technician";
    TradeType["MASON"] = "mason";
    TradeType["ROOFER"] = "roofer";
    TradeType["PAINTER"] = "painter";
    TradeType["FLOORING_INSTALLER"] = "flooring_installer";
    TradeType["GENERAL_CONTRACTOR"] = "general_contractor";
})(TradeType || (TradeType = {}));
export var SkillLevel;
(function (SkillLevel) {
    SkillLevel["APPRENTICE"] = "apprentice";
    SkillLevel["JOURNEYMAN"] = "journeyman";
    SkillLevel["SPECIALIST"] = "specialist";
    SkillLevel["MASTER"] = "master";
})(SkillLevel || (SkillLevel = {}));
export var ServiceAreaType;
(function (ServiceAreaType) {
    ServiceAreaType["RADIUS"] = "radius";
    ServiceAreaType["CITY"] = "city";
    ServiceAreaType["ZIP"] = "zip";
})(ServiceAreaType || (ServiceAreaType = {}));
export var ApplicationStatus;
(function (ApplicationStatus) {
    ApplicationStatus["APPLIED"] = "applied";
    ApplicationStatus["VIEWED"] = "viewed";
    ApplicationStatus["SHORTLISTED"] = "shortlisted";
    ApplicationStatus["REJECTED"] = "rejected";
    ApplicationStatus["WITHDRAWN"] = "withdrawn";
})(ApplicationStatus || (ApplicationStatus = {}));
