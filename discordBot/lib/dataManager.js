

class dataManager {

    token= ""
    client= ""
    status= ""
    clientId= ""
    token= ""
    ownerId= ""
    projectAlias= ""

    constructor() {
    }
    
}

module.exports = new dataManager();


function checkField(fieldInfo, data) {

    let unsavedData = data["unsaved_" + fieldInfo.name]

    if(unsavedData === undefined) unsavedData = ''
    if(data.status !== 'deleted'){

        if(fieldInfo.type === 'text' || fieldInfo.type === 'textarea'){

            //only check of unsavedData length > 0, set required = true if an empty string is not allowed
            if (fieldInfo.minZeichen > unsavedData.length && unsavedData.length > 0) {
                return { saved: false, infoMessage: "Es ist ein Fehler beim speichern aufgetreten (zu kurz)", infoStatus: "Error" }
            }
            if (fieldInfo.maxZeichen < unsavedData.length) {
                return { saved: false, infoMessage: "Es ist ein Fehler beim speichern aufgetreten (zu lang)", infoStatus: "Error" }
            }
        }

        //es muss mindestens ein zeichen gesetzt sein if required is true
        if (fieldInfo.required === true && unsavedData.length === 0) {
            return { saved: false, infoMessage: "Es ist ein Fehler beim speichern aufgetreten (required)", infoStatus: "Error" }
        }
    }

    return {saved: true}
}