//
//  LoginView.swift
//  Chesmes
//
//  Created by Ramon Jr Bahio on 4/15/25.
//

import SwiftUI

struct LoginView: View {
    var body: some View {
        VStack {
            HStack {
                Spacer()
                SimpleButton(systemImage: "server.rack")
            }
            Spacer()
        }
        .padding()
    }
}

#Preview {
    LoginView()
}
