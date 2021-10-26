import { Migration } from '@mikro-orm/migrations';

export class Migration20211026211534 extends Migration {

  async up(): Promise<void> {
    this.addSql('alter table "user" add column "avatar" text;');
  }

}
