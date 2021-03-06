#!/bin/sh

#创建随机名称
create_random_name(){
    local d=`date +%s%N`;
    echo jt`expr $d / 1000000`;
}

#通过gid获取组名
#gid
groupget_gid(){
    echo `getent group|grep :x:$1:|cut -d : -f 1`;
}

#通过gid获取用户名称列表
#gid
userget_gid(){
    echo `getent passwd|grep ^[^:]*:x:[0-9]*:$1|cut -d : -f 1`;
}

#通过用户名获取gid
#name
userget_name(){
    echo `getent passwd|grep ^$1:|cut -d : -f 4`;
}

#指定gid添加新组
#gid
local_groupadd(){
    if [ "$1" = "" ] || [ $1 -lt 1000 ] || [ `groupget_gid $1` ]; then
        return 0;
    fi
    
    local name=`create_random_name`;
    `groupadd -g $1 $name`;
    echo ADD GROUP OK;
}

#删除指定gid组
#gid
local_groupdel(){
    
    if [ "$1" = "" ] || [ $1 -lt 1000 ]; then
        return 0;
    fi

    local name=`groupget_gid $1`
    if [ "$name" = "" ]; then
        return 0;
    fi

    local username=`userget_gid $1`;
    if [ $username ]; then
        return 0;
    fi

    `groupdel $name`;
    echo DEL GROUP OK;
}

#添加新用户
#name, gid
local_useradd(){
    
    local gid=`userget_name $1`;
    if [ $gid ]; then
        return 0;
    fi

    echo `local_groupadd $2`;
    `useradd -g $2 -M $1`;
    #`passwd $1`;

    echo ADD USER OK;
}

#删除用户
#name
local_userdel(){

    local gid=`userget_name $1`;
    if [ "$gid" = "" ]; then
        return 0;
    fi

    `userdel $1`;
    echo DEL USER OK;
    echo `local_groupdel $gid`;
}

#杀死用户进程
#name
local_kill(){
    local gid=`userget_name $1`;
    if [ "$gid" = "" ]; then
        return 0;
    fi

    echo `pkill -9 -u $1`;
}

if [ $1 -eq 0 ]; then
    echo `local_groupadd $2`; 
elif [ $1 -eq 1 ]; then
    echo `local_groupdel $2`;
elif [ $1 -eq 2 ]; then
    echo `local_useradd $2 $3`;
elif [ $1 -eq 3 ]; then
    echo `local_userdel $2`; 
elif [ $1 -eq 4 ]; then 
    #杀死进程、删除用户
    echo `local_kill $2`;
    echo `local_userdel $2`;
elif [ $1 -eq 5 ]; then 
    echo `local_kill $2`;
elif [ $1 -eq 6 ]; then 
    echo OK;
fi




