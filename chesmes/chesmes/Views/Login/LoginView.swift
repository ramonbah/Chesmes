//
//  LoginView.swift
//  Chesmes
//
//  Created by Ramon Jr Bahio on 4/15/25.
//

import SwiftUI

struct LoginView: View {
    @State var error: String = ""
    var body: some View {
        ZStack {
            VStack {
                HStack {
                    Spacer()
                    SimpleButton(systemImage: "server.rack")
                }
                
                Spacer()
            }
            
            VStack {
                Image("splash")
                    .resizable()
                    .scaledToFit()
                    .frame(height: 250)
                
                HStack {
                    Text(error)
                        .font(.caption)
                        .foregroundStyle(.red)
                    
                    Spacer()
                }
                .padding(.horizontal)
                
                FieldView(title: "Username")
                
                FieldView(title: "Password")
                
                RequestButton(type: .login)
                
                RequestButton(type: .loginRegister)
            }
        }
        .padding()
    }
}

#Preview {
    LoginView()
}
