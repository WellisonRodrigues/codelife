module.exports = function(sequelize, db) {

  const s = sequelize.define("slides",
    {
      id: {
        type: db.TEXT,
        primaryKey: true
      },
      type: db.TEXT,
      title: db.TEXT,
      htmlcontent1: db.TEXT,
      htmlcontent2: db.TEXT,
      quizjson: db.TEXT,
      rulejson: db.TEXT,
      mlid: db.TEXT,
      ordering: db.INTEGER,
      pt_title: db.TEXT,
      pt_htmlcontent1: db.TEXT,
      pt_htmlcontent2: db.TEXT,
      pt_quizjson: db.TEXT,
      pt_rulejson: db.TEXT
    }, 
    {
      freezeTableName: true,
      timestamps: false
    }
  );

  s.associate = models => s.belongsTo(models.minilessons, {foreignKey: "mlid", targetKey: "id", as: "minilessons", foreignKeyConstraint: true});

  return s;

};
