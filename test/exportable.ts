import {exportable, Exportable, Importable, MySQL} from "../src/deadlock/api/util";

@Importable(

    // table
    "users",

    // fields
    [
        "id",
        "email",
        "password",
        ["dateInscription", "date_inscription"]
    ]
)
class User extends Exportable {

    @exportable()
    public id: number;

    @exportable()
    public email: string;

    public password?: string;

    public dateInscription?: number;
}


let user1: User = new User();
user1.id = 12;
user1.email = 'foo@bar.yea';
user1.password = 'olelo';

console.log(user1);
// User { id: 12, email: 'foo@bar.yea', password: 'olelo' }

console.log(user1.export());
// { id: 12, email: 'foo@bar.yea' }


let user2: User = new User(user1.export());

console.log(user2);
// User { id: 12, email: 'foo@bar.yea' }

console.log(user2.export());
// { id: 12, email: 'foo@bar.yea' }

console.log(MySQL.getImportableData(User));
// `users`.`id` as `id`,`users`.`email` as `email`,`users`.`password` as `password`,`users`.`date_inscription` as `dateInscription`

// get all the users:
// await MySQL.fetch(mysql, User)

// get the user whose id is 12:
// await MySQL.fetch(mysql, User, 'WHERE id=?', [12])

