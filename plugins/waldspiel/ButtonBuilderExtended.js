const { ButtonBuilder } = require("discord.js");

class ButtonBuilderExtended extends ButtonBuilder
{

  customId = ""

  setCustomId(params) {
    this.customId = params;
    return super.setCustomId(params)
  }

  setParameter(...args){
    var string = this.customId

    for (const element of args) {
      string += '-'+element
    }
    return super.setCustomId(string)
  }
  
}



module.exports = {
  ButtonBuilderExtended
};
