

module.exports = {
    //test if 
    isValid(data) {
        if (!data || data.status == "access denied") {
            console.log("return false")
            return false
        }
        console.log("return true")
        return true
    },
    notValid(data) {
        return !this.isValid(data)
    }
}

