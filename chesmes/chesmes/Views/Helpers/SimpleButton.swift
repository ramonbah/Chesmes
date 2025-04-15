//
//  SimpleButton.swift
//  Chesmes
//
//  Created by Ramon Jr Bahio on 4/15/25.
//

import SwiftUI

struct SimpleButton: View {
    var systemImage: String
    var body: some View {
        Button {
            print("pressed")
        } label: {
            Image(systemName: systemImage)
                .resizable()
                .aspectRatio(contentMode: .fit)
                .frame(width: 30, height: 30)
        }
        .tint(.accent)
        .frame(width: 40, height: 40)
    }
}

#Preview {
    SimpleButton(systemImage: "server.rack")
}
