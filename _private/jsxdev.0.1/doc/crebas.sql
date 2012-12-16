drop table if exists project;

drop table if exists project_relation;

drop table if exists user;

/*==============================================================*/
/* Table: project                                               */
/*==============================================================*/
create table project
(
   id                   bigint not null auto_increment comment 'ID',
   basedir              varchar(50) not null,
   top                  bigint,
   parent               bigint,
   tag                  bit not null comment '是否为tag',
   name                 varchar(255) not null comment '项目名称',
   info                 text not null comment '项目描叙',
   company              varchar(255),
   email                varchar(50),
   msn                  varchar(50),
   time                 datetime not null comment '项目创建时间',
   del                  bit not null,
   primary key (id)
);

alter table project comment '项目';
alter table project auto_increment=5000;

/*==============================================================*/
/* Table: project_relation                                      */
/*==============================================================*/
create table project_relation
(
   pid                  bigint not null,
   uid                  bigint not null,
   weight               tinyint not null comment '0  读、写、分配
            1  读、写
            2  读',
   primary key (pid, uid)
);

/*==============================================================*/
/* Table: user                                                  */
/*==============================================================*/
create table user
(
   id                   bigint not null auto_increment comment '用户ID',
   name                 varchar(50) not null comment '用户名',
   alias                varchar(50) not null comment '用户别名',
   password             varchar(50) not null comment '密码',
   email                varchar(50) not null comment '密码',
   disable              bit not null comment '是否禁用',
   time                 datetime not null comment '创建时间',
   code                 varchar(50) comment '状态码',
   primary key (id)
);

alter table user comment '用户';
alter table user auto_increment=5000;

alter table project add constraint FK_Reference_5 foreign key (parent)
      references project (id) on delete restrict on update restrict;

alter table project add constraint FK_Reference_6 foreign key (top)
      references project (id) on delete restrict on update restrict;

alter table project_relation add constraint FK_Reference_3 foreign key (pid)
      references project (id) on delete restrict on update restrict;

alter table project_relation add constraint FK_Reference_4 foreign key (uid)
      references user (id) on delete restrict on update restrict;

insert into user values(0, 'everyone', 'alias_everyone', 'c273ebd2aff556810556da03c49917ec', 'everyone@jsxdev.com', 0, '2012-02-09', '0');
