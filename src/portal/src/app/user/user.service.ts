// Copyright (c) 2017 VMware, Inc. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, catchError } from "rxjs/operators";
import { Observable, throwError as observableThrowError } from "rxjs";

import {HTTP_JSON_OPTIONS, HTTP_GET_OPTIONS} from "@harbor/ui";
import { User, LDAPUser } from './user';
import LDAPUsertoUser from './user';

const userMgmtEndpoint = '/api/users';
const userListSearch = '/api/users/search?';
const ldapUserEndpoint = '/api/ldap/users';

/**
 * Define related methods to handle account and session corresponding things
 *
 **
 * class SessionService
 */
@Injectable()
export class UserService {

    constructor(private http: HttpClient) { }

    // Handle the related exceptions
    handleError(error: any): Observable<any> {
        return observableThrowError(error.error || error);
    }

    // Get the user list
    getUsersNameList(name: string, page_size: number): Observable<User[]> {
        return this.http.get(`${userListSearch}page_size=${page_size}&username=${name}`, HTTP_GET_OPTIONS)
            .pipe(map(response => response as User[])
            , catchError(error => this.handleError(error)));
    }
    getUsers(): Observable<User[]> {
        return this.http.get(userMgmtEndpoint, HTTP_GET_OPTIONS)
            .pipe(map(response => response as User[])
            , catchError(error => this.handleError(error)));
    }

    // Add new user
    addUser(user: User): Observable<any> {
        return this.http.post(userMgmtEndpoint, JSON.stringify(user), HTTP_JSON_OPTIONS)
            .pipe(map(() => null)
            , catchError(error => this.handleError(error)));
    }

    // Delete the specified user
    deleteUser(userId: number): Observable<any> {
        return this.http.delete(userMgmtEndpoint + "/" + userId, HTTP_JSON_OPTIONS)
            .pipe(map(() => null)
            , catchError(error => this.handleError(error)));
    }

    // Update user to enable/disable the admin role
    updateUser(user: User): Observable<any> {
        return this.http.put(userMgmtEndpoint + "/" + user.user_id, JSON.stringify(user), HTTP_JSON_OPTIONS)
            .pipe(map(() => null)
            , catchError(error => this.handleError(error)));
    }

    // Set user admin role
    updateUserRole(user: User): Observable<any> {
        return this.http.put(userMgmtEndpoint + "/" + user.user_id + "/sysadmin", JSON.stringify(user), HTTP_JSON_OPTIONS)
            .pipe(map(() => null)
            , catchError(error => this.handleError(error)));
    }

    // admin change normal user pwd
    changePassword(uid: number, newPassword: string, confirmPwd: string): Observable<any> {
        if (!uid || !newPassword) {
            return observableThrowError("Invalid change uid or password");
        }

        return this.http.put(userMgmtEndpoint + '/' + uid + '/password',
            {
                "old_password": newPassword,
                'new_password': confirmPwd
            },
            HTTP_JSON_OPTIONS)
            .pipe(map(response => response)
            , catchError(error => {
                return observableThrowError(error);
            }));
    }

    // Get User from LDAP
    getLDAPUsers(username: string): Observable<User[]> {
        return this.http.get(`${ldapUserEndpoint}/search?username=${username}`, HTTP_GET_OPTIONS)
        .pipe(map(response => {
            let ldapUser = response as LDAPUser[] || [];
            return ldapUser.map(u => LDAPUsertoUser(u));
        })
        , catchError( error => this.handleError(error)));
    }

    importLDAPUsers(usernames: string[]): Observable<any> {
        return this.http.post(`${ldapUserEndpoint}/import`, JSON.stringify({ldap_uid_list: usernames}), HTTP_JSON_OPTIONS)
        .pipe(map(() => null )
        , catchError(err => this.handleError(err)));
    }
}
