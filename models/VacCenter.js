const sql = require('../config/vacCenterDB');

// Constructor
const VacCenter = function(vacCenter) {
    this.id = vacCenter.id;
    this.name = vacCenter.name;
    this.tel = vacCenter.tel;
};

VacCenter.getAll = result => {
    sql.query('SELECT * FROM vacCenters', (err, res) => {
        if (err) {
            console.log('Error: ', err);
            result(null, err);
            return;
        }
        console.log('VacCenter: ', res);
        result(null, res);
    });
}

module.exports = VacCenter;