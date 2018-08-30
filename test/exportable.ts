import {exportable, Exportable, Importable, importable, MySQL} from "../src/deadlock/api/util";

@Importable("users")
class User extends Exportable {

    @exportable()
    @importable('id')
    public id: number;

    @exportable()
    @importable('email')
    public email: string;

    @importable('password')
    public password?: string;

    @importable('date_inscription')
    public dateInscription?: number;
}

console.log("class", User);

let user1: User = new User();
user1.id = 12;
user1.email = 'foo@bar.yea';
user1.password = 'olelo';

console.log('user1', user1);
// User { id: 12, email: 'foo@bar.yea', password: 'olelo' }

console.log('user1 exported', user1.export());
// { id: 12, email: 'foo@bar.yea' }


let user2: User = new User(user1.export());

console.log('user2 imported from user1', user2);
// User { id: 12, email: 'foo@bar.yea' }

console.log('user2 exported', user2.export());
// { id: 12, email: 'foo@bar.yea' }

console.log('fields', MySQL.getImportableData(User));
// `users`.`id` as `id`,`users`.`email` as `email`,`users`.`password` as `password`,`users`.`date_inscription` as `dateInscription`

// get all the users:
// await MySQL.fetch(mysql, User)

// get the user whose id is 12:
// await MySQL.fetch(mysql, User, 'WHERE id=?', [12])

