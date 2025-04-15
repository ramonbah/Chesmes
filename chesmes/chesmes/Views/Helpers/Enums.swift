//
//  Enums.swift
//  Chesmes
//
//  Created by Ramon Jr Bahio on 4/15/25.
//

import SwiftUI

enum RequestButtonType {
    case login
    case loginRegister
    case register
    
    var title: String {
        switch self {
        case .login:
            return "Login"
        case .loginRegister:
            return "Register"
        case .register:
            return "Register"
        }
    }
    
    var foregroundColor: Color {
        switch self {
        case .login, .register:
            return .white
        case .loginRegister:
            return .gray
        }
    }
    
    var backgroundColor: Color {
        switch self {
        case .login, .register:
            return .accent
        case .loginRegister:
            return .accentSecondary
        }
    }
}
