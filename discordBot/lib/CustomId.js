
function CustomId(interaction) {

    this.customId = false;

    if(interaction.customId){
        this.customId = interaction.customId;
    }
    
}

CustomId.prototype.is = function is(customIdToCheck) {
    if(!this.customId) return false
    return ( this.customId.split("-")[0] == customIdToCheck )
};

CustomId.prototype.getParameter = function getParameter() {
    return ( this.customId.split("-") )
};

module.exports = CustomId

/*
function isButton(interaction, buttonId) {
	if (interaction.customId && (interaction.customId == buttonId || interaction.customId.includes(buttonId + "-"))) {
		return true
	}
	return false
}

function getButtonParameter(customId) {
	return customId.split("-")
}*/
