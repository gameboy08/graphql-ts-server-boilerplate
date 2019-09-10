import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  BeforeInsert,
  BaseEntity
} from "typeorm";
import * as uuidv4 from "uuid/v4"; //4
//Entity is a class that maps to a database table
@Entity("users")
export class User extends BaseEntity {
  //Each entity MUST have a primary column
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column("varchar", { length: 255 })
  email: string;

  @Column("text")
  password: string;

  @Column("boolean", { default: false })
  confirmed: boolean;

  //2:
  @BeforeInsert()
  addId() {
    this.id = uuidv4();
  }
}
