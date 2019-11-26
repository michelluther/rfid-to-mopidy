

const Card = function(id, trackUrl) {
    this._id = `${id[0].toString(16)}-${id[1].toString(16)}-${id[2].toString(16)}-${id[3].toString(16)}`
    this._trackUrl = trackUrl;

    this.getId = () => {
        return this._id;
    }
} 

module.exports = Card