//
//  RequestButton.swift
//  Chesmes
//
//  Created by Ramon Jr Bahio on 4/15/25.
//

import SwiftUI

struct RequestButton: View {
    var type: RequestButtonType
    var body: some View {
        Button {} label: {
            Spacer()
            Text(type.title)
                .padding(.vertical)
                .foregroundStyle(type.foregroundColor)
                .font(.headline)
            Spacer()
        }
        .background(type.backgroundColor)
        .clipShape(.buttonBorder)
        .padding(.horizontal)
    }
}

#Preview {
    RequestButton(type: .login)
}
