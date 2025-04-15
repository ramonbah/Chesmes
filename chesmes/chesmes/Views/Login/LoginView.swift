//
//  LoginView.swift
//  Chesmes
//
//  Created by Ramon Jr Bahio on 4/15/25.
//

import SwiftUI

struct LoginView: View {
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
            }
        }
        .padding()
    }
}

#Preview {
    LoginView()
}
